import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { connection } from '../lib/redis';
import { qBittorrentClient } from '../lib/qbittorrent';
import { supabase } from '../lib/supabase';
import { generateSecureLink } from '../lib/secure-link';
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
    let infoHash: string | null = null;
    let bunnyVideoId: string | null = null;

    try {
      // Fetch video from DB
      const { data: videoRecord, error: fetchErr } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (fetchErr || !videoRecord) {
        // PGRST116 = 0 rows returned — record was deleted (cancelled by user). Stop immediately.
        if (fetchErr?.code === 'PGRST116') {
          logger.info(`🗑️  [Job ${job.id}] Video record ${videoId} was removed — stopping job gracefully.`);
          return; // Stop processing silently
        }
        logger.error({ err: fetchErr }, `❌ [Job ${job.id}] Failed to fetch video record ${videoId}. Supabase error:`);
        throw new Error(`Failed to fetch video record ${videoId}: ${fetchErr?.message || 'No record found'}`);
      }

      infoHash = videoRecord.info_hash;

      // Update status to downloading_torrent
      await supabase.from('videos').update({ status: 'downloading_torrent' }).eq('id', videoId);

      // 1. Send to qBittorrent
      logger.info(`📥 [Job ${job.id}] Sending magnet to qBittorrent...`);
      await qBittorrentClient.addMagnet(magnet_uri);

      // 2. Poll for progress
      logger.info(`⏳ [Job ${job.id}] Polling for download completion...`);
      let isComplete = false;
      let lastProgress = -1;
      let lastProgressTime = Date.now();
      const STALL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

      while (!isComplete) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const torrentsInfo = await qBittorrentClient.getTorrentInfo(infoHash!);
        if (!torrentsInfo || torrentsInfo.length === 0) {
          logger.info(`🗑️  [Job ${job.id}] Torrent ${infoHash} was removed — job cancelled by user. Stopping.`);
          return; // Finish silently
        }

        const torrent = torrentsInfo[0];
        const progress = torrent.progress; // 0.0 to 1.0
        const progressPercentage = parseFloat((progress * 100).toFixed(2));
        logger.info(`📊 [Job ${job.id}] Download Progress: ${progressPercentage}%`);
        
        if (progressPercentage > lastProgress) {
          lastProgress = progressPercentage;
          lastProgressTime = Date.now();
        } else if (progressPercentage < 100) {
          // Check if stalled for more than 15 minutes
          if (Date.now() - lastProgressTime > STALL_TIMEOUT_MS) {
            throw new Error(`Torrent stalled: No progress updates for 15 minutes. Stuck at ${progressPercentage}%.`);
          }
        }

        // Map 0-100% torrent progress to 0-50% global progress
        const globalProgress = parseFloat((progressPercentage * 0.5).toFixed(2));
        await supabase.from('videos').update({ progress: globalProgress }).eq('id', videoId);

        if (progress === 1) {
          isComplete = true;
          logger.info(`✅ [Job ${job.id}] Download complete locally!`);
        }
      }

      // Prepare for Phase 4.2
      await supabase.from('videos').update({ status: 'exposing_http', progress: 50 }).eq('id', videoId);

      // 3. Generate Nginx Secure Link (valid for 24h)
      logger.info(`🔐 [Job ${job.id}] Generating Nginx secure link...`);
      const torrentFiles = await qBittorrentClient.client.get(`/api/v2/torrents/files?hash=${infoHash}`);
      if (!torrentFiles.data || torrentFiles.data.length === 0) {
        throw new Error('No files found in torrent');
      }

      // Find the largest file (likely the video)
      const largestFile = torrentFiles.data.reduce((prev: any, current: any) => (prev.size > current.size) ? prev : current);
      
      const filePath = `/downloads/${largestFile.name}`;

      const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:8081';
      // Encode each path segment individually to handle special chars like [ ] spaces etc.
      // but preserve the slash separators between segments.
      const encodedPath = filePath.split('/').map((seg: string) => encodeURIComponent(seg)).join('/');
      const fullDownloadUrl = `${NEXT_PUBLIC_URL}${encodedPath}`;
      
      logger.info(`🔗 [Job ${job.id}] Signed Nginx URL: ${fullDownloadUrl}`);

      // 4. Trigger Bunny Stream Ingestion (Phase 4.3)
      await supabase.from('videos').update({ status: 'bunny_fetching', progress: 55 }).eq('id', videoId);
      logger.info(`🐇 [Job ${job.id}] Ordering Bunny Stream to fetch video...`);

      const bunnyRes = await bunnyStreamClient.fetchVideo(fullDownloadUrl, videoRecord.title);
      
      // Check all possible ID properties that Bunny might return
      bunnyVideoId = bunnyRes.id || bunnyRes.videoGuid || bunnyRes.guid;

      if (!bunnyVideoId) {
        throw new Error(`Bunny CDN failed to return a valid video ID. Raw response: ${JSON.stringify(bunnyRes)}`);
      }
      
      await supabase.from('videos').update({ bunny_video_id: bunnyVideoId }).eq('id', videoId);
      logger.info(`🏷️ [Job ${job.id}] Assigned Bunny Video ID: ${bunnyVideoId}`);

      // 5. Phase 4.4: Encoding Poller
      await supabase.from('videos').update({ status: 'encoding' }).eq('id', videoId);
      logger.info(`🎬 [Job ${job.id}] Polling Bunny Stream for encoding completion...`);
      
      let isBunnyDone = false;
      while (!isBunnyDone) {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // poll every 10s
        const details = await bunnyStreamClient.getVideoDetails(bunnyVideoId!);
        
        // Bunny Stream API states: 3 = Finished, 4 = Resolution Finished
        // If the user has disabled encoding, status will still reach 3 (Finished) or 4
        // Status 5 is Failed.
        logger.info(`📺 [Job ${job.id}] Bunny Processing Status Code: ${details.status}`);
        
        const encodeProgress = details.encodeProgress || 0;
        // Map 0-100 of encodeProgress to 55-99% of global progress
        const globalProgress = parseFloat((55 + (encodeProgress * 0.44)).toFixed(2));
        
        // Only update progress if not finished yet, to avoid bouncing from 100 back to 99 right before completion
        if (globalProgress < 100) {
            await supabase.from('videos').update({ progress: globalProgress }).eq('id', videoId);
        }
        
        if (details.status === 3 || details.status === 4 || details.status === 6) {
           isBunnyDone = true;
        } else if (details.status === 5) {
           throw new Error('Bunny Stream failed to process the video.');
        }
      }

      // 6. Phase 4.5: Completion Pipeline
      logger.info(`🎉 [Job ${job.id}] Bunny processing complete. Video is ready!`);
      const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || '';
      
      // The stream URL format provided by Bunny stream
      const stream_url = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${bunnyVideoId}`;

      await supabase.from('videos').update({ 
        status: 'completed',
        stream_url: stream_url,
        progress: 100
      }).eq('id', videoId);

      // Cleanup local files via qBittorrent
      if (infoHash) {
        logger.info(`🧹 [Job ${job.id}] Cleaning up local qBittorrent files...`);
        // deleteFiles = true
        await qBittorrentClient.deleteTorrent(infoHash, true);
      }

      return { status: 'success', videoId, bunnyVideoId, stream_url };

    } catch (err: any) {
      // Don't log error if it was a planned cancellation or record deletion
      if (err.name === 'UnrecoverableError' || err.message.includes('Job cancelled') || err.message.includes('Job stopped')) {
        return; 
      }
      
      logger.error(`❌ [Job ${job.id}] Failed with error (Attempt ${job.attemptsMade + 1}):`, err);
      
      const maxAttempts = job.opts.attempts || 1;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        // Global error handler for this job on final failure
        await supabase.from('videos').update({ 
          status: 'failed', 
          error_message: err.message || 'Unknown error occurred'
        }).eq('id', videoId);

        // Attempt cleanup on final failure if infoHash is known
        if (infoHash) {
          logger.warn(`🛑 [Job ${job.id}] Skipping cleanup of local files for debugging purposes.`);
          // try {
          //   await qBittorrentClient.deleteTorrent(infoHash, true);
          // } catch (cleanupErr) { ... }
        }
      } else {
        // We will retry, so notify the UI
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
    lockDuration: 5 * 60 * 1000,    // 5 minutes — long enough for cloud Redis round trips
    lockRenewTime: 2 * 60 * 1000,   // Renew every 2 minutes (well within the 5min lock)
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
