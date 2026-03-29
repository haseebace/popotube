import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { connection } from '../lib/redis';
import { rdClient } from '../lib/real-debrid';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const INGESTION_QUEUE_NAME = 'ingestionQueue';
const RD_CONVERSION_POLL_MS = 750;
const RD_DOWNLOAD_POLL_FAST_MS = 1000;
const RD_DOWNLOAD_POLL_SLOW_MS = 2500;
const STEP_WARN_THRESHOLD_MS: Record<string, number> = {
  rd_add_magnet: 1500,
  rd_wait_for_conversion: 3000,
  rd_select_files: 1500,
  rd_wait_for_download: 5000,
  rd_refresh_completed_links: 1500,
  rd_unrestrict_link: 2000,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStepTimer(jobId: string | undefined, videoId: string) {
  const jobStartedAt = Date.now();

  return {
    step(label: string) {
      const stepStartedAt = Date.now();

      return {
        finish(extra: Record<string, unknown> = {}) {
          const durationMs = Date.now() - stepStartedAt;
          const thresholdMs = STEP_WARN_THRESHOLD_MS[label] ?? 3000;
          const logLevel: 'info' | 'warn' = durationMs >= thresholdMs ? 'warn' : 'info';

          logger[logLevel]({
            jobId,
            videoId,
            step: label,
            duration_ms: durationMs,
            total_elapsed_ms: Date.now() - jobStartedAt,
            ...extra,
          }, durationMs >= thresholdMs ? 'Ingestion step completed slowly' : 'Ingestion step completed');
        }
      };
    },
    total(extra: Record<string, unknown> = {}) {
      const totalElapsedMs = Date.now() - jobStartedAt;
      const logLevel: 'info' | 'warn' = totalElapsedMs >= 15000 ? 'warn' : 'info';

      logger[logLevel]({
        jobId,
        videoId,
        total_elapsed_ms: totalElapsedMs,
        ...extra,
      }, totalElapsedMs >= 15000 ? 'Ingestion completed slowly' : 'Ingestion completed');
    }
  };
}

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
    let rdTorrentId: string | null = null;
    const timing = createStepTimer(job.id, videoId);

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
      const addMagnetStep = timing.step('rd_add_magnet');
      logger.info(`📥 [Job ${job.id}] Sending magnet to Real-Debrid...`);
      rdTorrentId = await rdClient.addMagnet(magnet_uri);
      addMagnetStep.finish({ rd_torrent_id: rdTorrentId });

      // Wait for Real-Debrid to convert magnet and prepare files
      logger.info(`⏳ [Job ${job.id}] Waiting for Real-Debrid to convert magnet...`);
      let isWaitingFiles = false;
      let torrentInfo;
      let conversionPolls = 0;
      const conversionStep = timing.step('rd_wait_for_conversion');

      while (!isWaitingFiles) {
        if (conversionPolls > 0) {
          await wait(RD_CONVERSION_POLL_MS);
        }
        torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
        conversionPolls++;

        if (torrentInfo.status === 'waiting_files_selection') {
          isWaitingFiles = true;
        } else if (torrentInfo.status === 'downloaded' || torrentInfo.status === 'downloading' || torrentInfo.status === 'queued') {
          isWaitingFiles = true; 
        } else if (torrentInfo.status === 'magnet_error' || torrentInfo.status === 'error' || torrentInfo.status === 'dead') {
          throw new Error(`Real-Debrid error: Torrent is ${torrentInfo.status}`);
        }
      }
      conversionStep.finish({
        polls: conversionPolls,
        rd_status: torrentInfo?.status,
      });

      // Select Files (if needed)
      if (torrentInfo!.status === 'waiting_files_selection') {
        const selectFilesStep = timing.step('rd_select_files');
        logger.info(`📁 [Job ${job.id}] Selecting largest video file in Real-Debrid...`);
        await rdClient.selectFiles(rdTorrentId, torrentInfo, videoRecord.title);
        selectFilesStep.finish({
          total_files: torrentInfo?.files?.length ?? 0,
        });
      }

      // Poll for download completion on Real-Debrid
      logger.info(`⏳ [Job ${job.id}] Polling for Real-Debrid download completion...`);
      let isComplete = false;
      let downloadPolls = 0;
      const downloadStep = timing.step('rd_wait_for_download');
      while (!isComplete) {
        if (downloadPolls > 0) {
          const pollDelay = downloadPolls <= 5 ? RD_DOWNLOAD_POLL_FAST_MS : RD_DOWNLOAD_POLL_SLOW_MS;
          await wait(pollDelay);
        }

        torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
        downloadPolls++;
        
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
      downloadStep.finish({
        polls: downloadPolls,
        rd_status: torrentInfo?.status,
        rd_progress: torrentInfo?.progress ?? 0,
      });

      // Phase 3.2: Unrestrict the Link
      await supabase.from('videos').update({ status: 'exposing_http', progress: 50 }).eq('id', videoId);
      logger.info(`🔐 [Job ${job.id}] Unrestricting link via Real-Debrid...`);
      
      // Get the finalized links from torrentInfo
      const finalizedLinkStep = timing.step('rd_refresh_completed_links');
      torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
      finalizedLinkStep.finish({
        link_count: torrentInfo?.links?.length ?? 0,
      });
      if (!torrentInfo.links || torrentInfo.links.length === 0) {
        throw new Error('Real-Debrid provided no download links after completion.');
      }
      
      // In Real-Debrid, we only selected one target file, so there should be 1 link we care about
      const unrestrictStep = timing.step('rd_unrestrict_link');
      const unrestrictData = await rdClient.unrestrictLink(torrentInfo.links[0]);
      const fullDownloadUrl = unrestrictData.download;
      unrestrictStep.finish({
        filename: unrestrictData.filename,
        streamable: Boolean(unrestrictData.streamable),
        filesize: unrestrictData.filesize,
      });
      
      logger.info(`🔗 [Job ${job.id}] Direct Download URL acquired! Size: ${unrestrictData.filesize} bytes`);

      // Mark the title as playback-ready using the direct RD link
      const containerExt = unrestrictData.filename.split('.').pop()?.toLowerCase() || 'unknown';
      const isStreamable = containerExt === 'mp4' || containerExt === 'webm';

      const rdPlaybackSource = {
         type: 'direct',
         url: fullDownloadUrl,
         codec: videoRecord.codec || 'Unknown',
         container: containerExt,
         mime_type: unrestrictData.mimeType || 'video/mp4',
         is_streamable: isStreamable,
         source_type: 'real_debrid'
      };

      await supabase.from('videos').update({ 
         status: 'completed',
         progress: 100,
         stream_url: fullDownloadUrl,
         playback_source: rdPlaybackSource
      }).eq('id', videoId);

      logger.info(`✅ [Job ${job.id}] Video is ready for playback via Real-Debrid!`);

      timing.total({
        rd_torrent_id: rdTorrentId,
        playback_source_type: rdPlaybackSource.type,
        source_type: rdPlaybackSource.source_type,
      });

      return { status: 'success', videoId, stream_url: fullDownloadUrl, playback_source: rdPlaybackSource };

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
        
        // We no longer delete the Real-Debrid torrent here (Task 5.2)
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
