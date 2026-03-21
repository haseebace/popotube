import pino from 'pino';
import pretty from 'pino-pretty';

function buildContextParts(log: Record<string, any>) {
  const context: string[] = [];

  if (log.reqId) context.push(`req=${log.reqId}`);
  if (log.jobId) context.push(`job=${log.jobId}`);
  if (log.videoId) context.push(`video=${log.videoId}`);
  if (log.step) context.push(`step=${log.step}`);
  if (log.method && log.path) {
    context.push(`${String(log.method).toUpperCase()} ${log.path}`);
  } else if (log.path) {
    context.push(`path=${log.path}`);
  }
  if (typeof log.status !== 'undefined') context.push(`status=${log.status}`);
  if (log.rd_torrent_id) context.push(`rd=${log.rd_torrent_id}`);
  if (log.cdn_video_id) context.push(`cdn=${log.cdn_video_id}`);
  if (log.source_type) context.push(`source=${log.source_type}`);

  return context;
}

function buildMetricParts(log: Record<string, any>) {
  const metrics: string[] = [];

  if (typeof log.duration_ms === 'number') metrics.push(`duration=${log.duration_ms}ms`);
  if (typeof log.total_elapsed_ms === 'number') metrics.push(`elapsed=${log.total_elapsed_ms}ms`);
  if (typeof log.total_duration_ms === 'number') metrics.push(`total=${log.total_duration_ms}ms`);
  if (typeof log.queue_duration_ms === 'number') metrics.push(`queue=${log.queue_duration_ms}ms`);
  if (typeof log.polls === 'number') metrics.push(`polls=${log.polls}`);
  if (typeof log.rd_progress === 'number') metrics.push(`rd_progress=${log.rd_progress}%`);
  if (typeof log.link_count === 'number') metrics.push(`links=${log.link_count}`);
  if (typeof log.filesize === 'number') metrics.push(`size=${log.filesize}`);
  if (log.rd_status) metrics.push(`rd_status=${log.rd_status}`);
  if (typeof log.streamable !== 'undefined') metrics.push(`streamable=${Boolean(log.streamable)}`);

  return metrics;
}

const prettyStream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  singleLine: true,
  levelFirst: true,
  errorLikeObjectKeys: ['err', 'error'],
  ignore: [
    'pid',
    'hostname',
    'service',
    'reqId',
    'jobId',
    'videoId',
    'step',
    'method',
    'path',
    'status',
    'rd_torrent_id',
    'cdn_video_id',
    'source_type',
    'duration_ms',
    'total_elapsed_ms',
    'total_duration_ms',
    'queue_duration_ms',
    'polls',
    'rd_progress',
    'link_count',
    'filesize',
    'rd_status',
    'streamable',
  ].join(','),
  messageFormat: (log: Record<string, any>, messageKey: string) => {
    const message = log[messageKey];
    const context = buildContextParts(log);
    const metrics = buildMetricParts(log);

    return [message, ...context, ...metrics].filter(Boolean).join(' | ');
  },
});

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'backend',
  },
}, prettyStream);
