alter table public.readings
  add column if not exists response_email_sent_at timestamptz,
  add column if not exists response_email_sent_to text,
  add column if not exists response_email_id text,
  add column if not exists response_email_provider text,
  add column if not exists response_email_last_error text;

create index if not exists readings_response_email_sent_at_idx
  on public.readings (response_email_sent_at desc nulls first);

create index if not exists readings_response_email_id_idx
  on public.readings (response_email_id);
