import pino from 'pino';
import pretty from 'pino-pretty';

function buildContextParts(log: Record<string, any>) {
  const context: string[] = [];
  const requestMethod = log.method ?? log.req?.method;
  const requestPath = log.path ?? log.req?.url;
  const statusCode = typeof log.status !== 'undefined' ? log.status : log.res?.statusCode;

  if (log.reqId) context.push(`req=${log.reqId}`);
  if (log.jobId) context.push(`job=${log.jobId}`);
  if (log.videoId) context.push(`video=${log.videoId}`);
  if (log.step) context.push(`step=${log.step}`);
  if (requestMethod && requestPath) {
    context.push(`${String(requestMethod).toUpperCase()} ${requestPath}`);
  } else if (requestPath) {
    context.push(`path=${requestPath}`);
  }
  if (typeof statusCode !== 'undefined') context.push(`status=${statusCode}`);
  if (log.rd_torrent_id) context.push(`rd=${log.rd_torrent_id}`);
  if (log.source_type) context.push(`source=${log.source_type}`);

  return context;
}

function buildMetricParts(log: Record<string, any>) {
  const metrics: string[] = [];
  const responseTime =
    typeof log.responseTime === 'number'
      ? log.responseTime
      : typeof log.response_time_ms === 'number'
        ? log.response_time_ms
        : undefined;

  if (typeof log.duration_ms === 'number') metrics.push(`duration=${log.duration_ms}ms`);
  if (typeof log.total_elapsed_ms === 'number') metrics.push(`elapsed=${log.total_elapsed_ms}ms`);
  if (typeof log.total_duration_ms === 'number') metrics.push(`total=${log.total_duration_ms}ms`);
  if (typeof log.queue_duration_ms === 'number') metrics.push(`queue=${log.queue_duration_ms}ms`);
  if (typeof responseTime === 'number') metrics.push(`response=${responseTime.toFixed(1)}ms`);
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
    'req',
    'res',
    'responseTime',
    'response_time_ms',
    'jobId',
    'videoId',
    'step',
    'method',
    'path',
    'status',
    'rd_torrent_id',
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
