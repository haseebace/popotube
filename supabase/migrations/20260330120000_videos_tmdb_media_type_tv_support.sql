-- Align `videos` with public movie vs TV watch pages (TMDB id namespaces).
-- Applied to hosted project via Supabase MCP; keep file in repo for local `db push` / review.

alter table public.videos
  add column if not exists tmdb_media_type text not null default 'movie',
  add column if not exists tmdb_episode_id integer;

alter table public.videos
  drop constraint if exists videos_tmdb_media_type_check;

alter table public.videos
  add constraint videos_tmdb_media_type_check
  check (tmdb_media_type in ('movie', 'tv'));

comment on column public.videos.tmdb_media_type is
  'TMDB namespace for tmdb_id: movie vs TV series; TV episodes also use season_number + episode_number.';

comment on column public.videos.tmdb_episode_id is
  'Optional TMDB episode id when known (e.g. from API); for dedupe and deep links.';

update public.videos
set tmdb_media_type = 'tv'
where season_number is not null
  and episode_number is not null;

create index if not exists videos_tmdb_tv_episode_idx
  on public.videos (tmdb_id, season_number, episode_number)
  where tmdb_media_type = 'tv' and tmdb_id is not null;

create index if not exists videos_tmdb_movie_idx
  on public.videos (tmdb_id)
  where tmdb_media_type = 'movie' and tmdb_id is not null;
