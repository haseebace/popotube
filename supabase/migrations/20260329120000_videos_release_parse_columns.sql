-- Parsed torrent/release metadata (hybrid: key columns + jsonb extras).
-- Apply in Supabase SQL editor or via supabase db push if linked.

alter table public.videos
  add column if not exists season_number integer,
  add column if not exists episode_number integer,
  add column if not exists release_year integer,
  add column if not exists release_group text,
  add column if not exists release_parse_extras jsonb;

comment on column public.videos.season_number is 'TV season from release title when unambiguous';
comment on column public.videos.episode_number is 'TV episode from release title when single episode';
comment on column public.videos.release_year is 'Year extracted from release title';
comment on column public.videos.release_group is 'Release group from parsed title';
comment on column public.videos.release_parse_extras is 'HDR, audio, multi-episode packs, etc.';
