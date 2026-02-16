create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  reading_id uuid references public.readings(id) on delete set null,
  file_name text not null,
  original_name text not null,
  file_type text,
  file_size bigint,
  storage_path text not null,
  photo_type text,
  created_at timestamptz not null default now()
);

create index if not exists uploaded_files_pet_idx on public.uploaded_files(pet_id, created_at desc);
create index if not exists uploaded_files_reading_idx on public.uploaded_files(reading_id, created_at desc);
create index if not exists uploaded_files_customer_idx on public.uploaded_files(customer_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.uploaded_files enable row level security;

drop policy if exists "uploaded files are admin-only" on public.uploaded_files;
create policy "uploaded files are admin-only"
on public.uploaded_files
for select
using (false);
