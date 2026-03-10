import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { connection } from '../lib/redis';
import { rdClient } from '../lib/real-debrid';
import { supabase } from '../lib/supabase';
import { bunnyStreamClient } from '../lib/bunny';
import { logger } from '../lib/logger';

export const INGESTION_QUEUE_NAME = 'ingestionQueue';

// Initialize the Queue
export const ingestionQueue = new Queue(INGESTION_QUEUE_NAME, {
  connection: connection as any,
});

// Basic Worker for the Ingestion Queue
export const ingestionWorker = new Worker(
  INGESTION_QUEUE_NAME,
  async (job) => {
    logger.info(`🚀 [Job ${job.id}] Started processing ingestion job`);
    const { videoId, magnet_uri } = job.data;
    let bunnyVideoId: string | null = null;
    let rdTorrentId: string | null = null;

    try {
      // Fetch video from DB
      const { data: videoRecord, error: fetchErr } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (fetchErr || !videoRecord) {
        if (fetchErr?.code === 'PGRST116') {
          logger.info(`🗑️  [Job ${job.id}] Video record ${videoId} was removed — stopping job gracefully.`);
          return; // Stop processing silently
        }
        logger.error({ err: fetchErr }, `❌ [Job ${job.id}] Failed to fetch video record ${videoId}. Supabase error:`);
        throw new Error(`Failed to fetch video record ${videoId}: ${fetchErr?.message || 'No record found'}`);
      }

      // Update status to downloading_torrent
      await supabase.from('videos').update({ status: 'downloading_torrent' }).eq('id', videoId);

      // Phase 3.1: Send to Real-Debrid
      logger.info(`📥 [Job ${job.id}] Sending magnet to Real-Debrid...`);
      rdTorrentId = await rdClient.addMagnet(magnet_uri);

      // Wait for Real-Debrid to convert magnet and prepare files
      logger.info(`⏳ [Job ${job.id}] Waiting for Real-Debrid to convert magnet...`);
      let isWaitingFiles = false;
      let torrentInfo;

      while (!isWaitingFiles) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);

        if (torrentInfo.status === 'waiting_files_selection') {
          isWaitingFiles = true;
        } else if (torrentInfo.status === 'downloaded' || torrentInfo.status === 'downloading' || torrentInfo.status === 'queued') {
          isWaitingFiles = true; 
        } else if (torrentInfo.status === 'magnet_error' || torrentInfo.status === 'error' || torrentInfo.status === 'dead') {
          throw new Error(`Real-Debrid error: Torrent is ${torrentInfo.status}`);
        }
      }

      // Select Files (if needed)
      if (torrentInfo!.status === 'waiting_files_selection') {
        logger.info(`📁 [Job ${job.id}] Selecting largest video file in Real-Debrid...`);
        await rdClient.selectFiles(rdTorrentId);
      }

      // Poll for download completion on Real-Debrid
      logger.info(`⏳ [Job ${job.id}] Polling for Real-Debrid download completion...`);
      let isComplete = false;
      while (!isComplete) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
        
        const progressPercentage = parseFloat((torrentInfo.progress || 0).toFixed(2));
        logger.info(`📊 [Job ${job.id}] RD Progress: ${progressPercentage}%`);
        
        // Map 0-100% torrent progress to 0-50% global progress
        const globalProgress = parseFloat((progressPercentage * 0.5).toFixed(2));
        await supabase.from('videos').update({ progress: globalProgress }).eq('id', videoId);

        if (torrentInfo.status === 'downloaded') {
          isComplete = true;
          logger.info(`✅ [Job ${job.id}] Download complete on Real-Debrid!`);
        } else if (torrentInfo.status === 'error' || torrentInfo.status === 'virus' || torrentInfo.status === 'dead') {
          throw new Error(`Real-Debrid download failed: ${torrentInfo.status}`);
        }
      }

      // Phase 3.2: Unrestrict the Link
      await supabase.from('videos').update({ status: 'exposing_http', progress: 50 }).eq('id', videoId);
      logger.info(`🔐 [Job ${job.id}] Unrestricting link via Real-Debrid...`);
      
      // Get the finalized links from torrentInfo
      torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
      if (!torrentInfo.links || torrentInfo.links.length === 0) {
        throw new Error('Real-Debrid provided no download links after completion.');
      }
      
      // In Real-Debrid, we only selected one target file, so there should be 1 link we care about
      const unrestrictData = await rdClient.unrestrictLink(torrentInfo.links[0]);
      const fullDownloadUrl = unrestrictData.download;
      
      logger.info(`🔗 [Job ${job.id}] Direct Download URL acquired! Size: ${unrestrictData.filesize} bytes`);

      // Trigger Bunny Stream Ingestion
      await supabase.from('videos').update({ status: 'bunny_fetching', progress: 55 }).eq('id', videoId);
      logger.info(`🐇 [Job ${job.id}] Ordering Bunny Stream to fetch video...`);

      const bunnyRes = await bunnyStreamClient.fetchVideo(fullDownloadUrl, videoRecord.title);
      
      bunnyVideoId = bunnyRes.id || bunnyRes.videoGuid || bunnyRes.guid;

      if (!bunnyVideoId) {
        throw new Error(`Bunny CDN failed to return a valid video ID. Raw response: ${JSON.stringify(bunnyRes)}`);
      }
      
      await supabase.from('videos').update({ bunny_video_id: bunnyVideoId }).eq('id', videoId);
      logger.info(`🏷️ [Job ${job.id}] Assigned Bunny Video ID: ${bunnyVideoId}`);

      // Phase 3.3: Encoding Poller
      await supabase.from('videos').update({ status: 'encoding' }).eq('id', videoId);
      logger.info(`🎬 [Job ${job.id}] Polling Bunny Stream for encoding completion...`);
      
      let isBunnyDone = false;
      let lastEncodeProgress = 0;
      let stalledCount = 0;

      while (!isBunnyDone) {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // poll every 10s
        const details = await bunnyStreamClient.getVideoDetails(bunnyVideoId!);
        
        logger.info(`📺 [Job ${job.id}] Bunny Processing Status Code: ${details.status}`);
        
        const encodeProgress = details.encodeProgress || 0;
        // Map 0-100 of encodeProgress to 55-99% of global progress
        const globalProgress = parseFloat((55 + (encodeProgress * 0.44)).toFixed(2));
        
        if (globalProgress < 100) {
            await supabase.from('videos').update({ progress: globalProgress }).eq('id', videoId);
        }
        
        if (details.status === 3 || details.status === 4 || details.status === 6) {
           isBunnyDone = true;
        } else if (details.status === 5) {
           throw new Error('Bunny Stream failed to process the video.');
        } else {
           if (encodeProgress === lastEncodeProgress) {
             stalledCount++;
             if (stalledCount > 60) { // Stalled for ~10 minutes
                throw new Error('Bunny Stream encoding seems stalled.');
             }
           } else {
             stalledCount = 0;
             lastEncodeProgress = encodeProgress;
           }
        }
      }

      // Completion Pipeline
      logger.info(`🎉 [Job ${job.id}] Bunny processing complete. Video is ready!`);
      const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || '';
      
      const stream_url = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${bunnyVideoId}`;

      await supabase.from('videos').update({ 
        status: 'completed',
        stream_url: stream_url,
        progress: 100
      }).eq('id', videoId);

      // Cleanup Real-Debrid
      if (rdTorrentId) {
        logger.info(`🧹 [Job ${job.id}] Cleaning up Real-Debrid torrent...`);
        try {
          await rdClient.deleteTorrent(rdTorrentId);
        } catch (e) {
          logger.warn(`Could not delete RD torrent ${rdTorrentId}. Ignoring.`);
        }
      }

      return { status: 'success', videoId, bunnyVideoId, stream_url };

    } catch (err: any) {
      if (err.name === 'UnrecoverableError' || err.message.includes('Job cancelled') || err.message.includes('Job stopped')) {
        return; 
      }
      
      logger.error(`❌ [Job ${job.id}] Failed with error (Attempt ${job.attemptsMade + 1}):`, err);
      
      const maxAttempts = job.opts.attempts || 1;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        await supabase.from('videos').update({ 
          status: 'failed', 
          error_message: err.message || 'Unknown error occurred'
        }).eq('id', videoId);

        // Attempt cleanup on final failure
        if (rdTorrentId) {
          logger.warn(`🛑 [Job ${job.id}] Deleting Real-Debrid torrent due to final job failure.`);
          try {
            await rdClient.deleteTorrent(rdTorrentId);
          } catch (cleanupErr) { 
            // ignore
          }
        }
      } else {
        await supabase.from('videos').update({ 
          status: 'retrying', 
          error_message: `Attempt ${job.attemptsMade + 1} failed: ${err.message}. Retrying...`
        }).eq('id', videoId);
      }

      throw err;
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000, 
    lockRenewTime: 2 * 60 * 1000,
  }
);

ingestionWorker.on('completed', (job) => {
  logger.info(`💯 Job ${job.id} has successfully completed end-to-end!`);
});

ingestionWorker.on('failed', (job, err) => {
  if (err.name === 'UnrecoverableError' || err.message.includes('Job cancelled')) {
    logger.info(`🗑️  [Job ${job?.id}] Job was removed or cancelled: ${err.message}`);
  } else {
    logger.error({ err }, `💥 [Job ${job?.id}] has critically failed: ${err.message}`);
  }
});
