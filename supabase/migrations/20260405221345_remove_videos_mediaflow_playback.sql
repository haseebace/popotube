-- Remove MediaFlow HLS column; Real-Debrid playback stays in playback_source / stream_url.
alter table public.videos drop column if exists mediaflow_playback;
