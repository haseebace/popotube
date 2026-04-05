-- Separate MediaFlow HLS / proxy playback URLs from canonical Real-Debrid source in `playback_source`.
-- `playback_source` remains the unrestricted RD link + metadata; transcode manifests live here when used.

alter table public.videos
  add column if not exists mediaflow_playback jsonb;

comment on column public.videos.mediaflow_playback is
  'When browser-incompatible containers need transcoding, stores MediaFlow HLS manifest URL and metadata. Real-Debrid URL stays in playback_source / stream_url.';
