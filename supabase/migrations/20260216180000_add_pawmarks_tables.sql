create table if not exists public.pawmarks_profiles (
  id text primary key,
  pet_name text not null,
  owner_name text not null,
  title_style text not null default 'serif' check (title_style in ('serif', 'script', 'caps', 'soft')),
  hero_image text not null,
  tagline text,
  dates text,
  species text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pawmarks_posts (
  id text primary key,
  profile_id text not null references public.pawmarks_profiles(id) on delete cascade,
  created_at_ms bigint not null default ((extract(epoch from now()) * 1000)::bigint),
  title text,
  body text,
  images text[] not null default '{}',
  youtube_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pawmarks_profiles_updated_idx on public.pawmarks_profiles(updated_at desc);
create index if not exists pawmarks_posts_profile_idx on public.pawmarks_posts(profile_id, created_at_ms desc);

create or replace function public.set_pawmarks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pawmarks_profiles_updated_at on public.pawmarks_profiles;
create trigger pawmarks_profiles_updated_at
before update on public.pawmarks_profiles
for each row execute procedure public.set_pawmarks_updated_at();

drop trigger if exists pawmarks_posts_updated_at on public.pawmarks_posts;
create trigger pawmarks_posts_updated_at
before update on public.pawmarks_posts
for each row execute procedure public.set_pawmarks_updated_at();

alter table public.pawmarks_profiles enable row level security;
alter table public.pawmarks_posts enable row level security;

drop policy if exists "pawmarks profiles are public readable" on public.pawmarks_profiles;
create policy "pawmarks profiles are public readable"
on public.pawmarks_profiles
for select
using (true);

drop policy if exists "pawmarks posts are public readable" on public.pawmarks_posts;
create policy "pawmarks posts are public readable"
on public.pawmarks_posts
for select
using (true);
