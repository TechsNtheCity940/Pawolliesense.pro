create table if not exists public.resend_email_events (
  id uuid primary key default gen_random_uuid(),
  svix_id text not null unique,
  svix_timestamp bigint,
  event_type text not null,
  event_created_at timestamptz,
  email_id text,
  recipient_email text,
  reading_id uuid references public.readings(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resend_email_events_created_idx
  on public.resend_email_events (created_at desc);

create index if not exists resend_email_events_event_created_idx
  on public.resend_email_events (event_created_at desc nulls last);

create index if not exists resend_email_events_email_id_idx
  on public.resend_email_events (email_id);

create index if not exists resend_email_events_reading_idx
  on public.resend_email_events (reading_id, created_at desc);

create index if not exists resend_email_events_customer_idx
  on public.resend_email_events (customer_id, created_at desc);
