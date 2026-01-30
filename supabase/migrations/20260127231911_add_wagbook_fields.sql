-- Add Wag Book fields to readings table
alter table if exists public.readings
  add column if not exists wagbook_requested boolean default false,
  add column if not exists wagbook_character_names text,
  add column if not exists wagbook_storyline text,
  add column if not exists wagbook_reference_images text[],
  add column if not exists wagbook_cover_image text,
  add column if not exists wagbook_price numeric;
