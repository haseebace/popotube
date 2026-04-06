-- Identity tables for TMDB movies vs TV episodes; videos rows link via FKs (future-implementation §11).
-- Version aligned with Supabase hosted migration `add_media_identity_tables`.

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_movie_id integer not null unique,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.movies is 'TMDB movie identity; one row per tmdb_movie_id.';

create table public.tv_series (
  id uuid primary key default gen_random_uuid(),
  tmdb_series_id integer not null unique,
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tv_series is 'TMDB TV series identity; tmdb_series_id matches videos.tmdb_id for TV rows.';

create table public.tv_episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.tv_series (id) on delete cascade,
  tmdb_series_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  tmdb_episode_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, season_number, episode_number)
);

create index tv_episodes_tmdb_series_lookup_idx
  on public.tv_episodes (tmdb_series_id, season_number, episode_number);

comment on table public.tv_episodes is 'One row per series + season + episode; links to tv_series.';

alter table public.videos
  add column movie_id uuid references public.movies (id) on delete set null,
  add column tv_episode_id uuid references public.tv_episodes (id) on delete set null;

create index videos_movie_id_idx on public.videos (movie_id) where movie_id is not null;
create index videos_tv_episode_id_idx on public.videos (tv_episode_id) where tv_episode_id is not null;

alter table public.movies enable row level security;
alter table public.tv_series enable row level security;
alter table public.tv_episodes enable row level security;

-- Backfill movies from existing video rows
insert into public.movies (tmdb_movie_id, title)
select distinct on (v.tmdb_id)
  v.tmdb_id,
  coalesce(nullif(trim(v.title), ''), 'Unknown')
from public.videos v
where v.tmdb_media_type = 'movie'
  and v.tmdb_id is not null
order by v.tmdb_id, v.created_at desc
on conflict (tmdb_movie_id) do update
set
  title = excluded.title,
  updated_at = now();

update public.videos v
set movie_id = m.id
from public.movies m
where v.tmdb_media_type = 'movie'
  and v.tmdb_id = m.tmdb_movie_id;

-- TV series
insert into public.tv_series (tmdb_series_id, name)
select distinct on (v.tmdb_id)
  v.tmdb_id,
  coalesce(nullif(trim(v.title), ''), '')
from public.videos v
where v.tmdb_media_type = 'tv'
  and v.tmdb_id is not null
order by v.tmdb_id, v.created_at desc
on conflict (tmdb_series_id) do update
set
  name = excluded.name,
  updated_at = now();

-- TV episodes (distinct episode keys from videos)
insert into public.tv_episodes (
  series_id,
  tmdb_series_id,
  season_number,
  episode_number,
  tmdb_episode_id
)
select distinct on (v.tmdb_id, v.season_number, v.episode_number)
  s.id,
  v.tmdb_id,
  v.season_number,
  v.episode_number,
  v.tmdb_episode_id
from public.videos v
join public.tv_series s on s.tmdb_series_id = v.tmdb_id
where v.tmdb_media_type = 'tv'
  and v.tmdb_id is not null
  and v.season_number is not null
  and v.episode_number is not null
order by v.tmdb_id, v.season_number, v.episode_number, v.created_at desc
on conflict (series_id, season_number, episode_number) do update
set
  tmdb_episode_id = coalesce(excluded.tmdb_episode_id, public.tv_episodes.tmdb_episode_id),
  updated_at = now();

update public.videos v
set tv_episode_id = e.id
from public.tv_episodes e
where v.tmdb_media_type = 'tv'
  and v.tmdb_id = e.tmdb_series_id
  and v.season_number = e.season_number
  and v.episode_number = e.episode_number;
