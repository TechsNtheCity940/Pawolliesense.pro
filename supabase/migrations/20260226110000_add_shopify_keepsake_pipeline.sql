alter table public.customers
  add column if not exists profile_image_url text;

alter table public.pets
  add column if not exists primary_image_url text;

alter table public.readings
  add column if not exists keepsakes jsonb not null default '[]'::jsonb,
  add column if not exists keepsake_status text not null default 'none',
  add column if not exists keepsake_last_error text;

create table if not exists public.keepsake_orders (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  keepsake_type text not null,
  status text not null default 'queued',
  quantity integer not null default 1,
  price numeric,
  service_context text[] not null default '{}',
  customization jsonb not null default '{}'::jsonb,
  source_images text[] not null default '{}',
  generated_copy text,
  generated_asset_url text,
  generated_asset_storage_path text,
  shopify_draft_order_id text,
  shopify_draft_order_name text,
  shopify_invoice_url text,
  shopify_order_id text,
  shopify_payload jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.keepsake_orders
  add constraint keepsake_orders_reading_type_key unique (reading_id, keepsake_type);

create index if not exists keepsake_orders_status_idx
  on public.keepsake_orders(status, created_at desc);

create index if not exists keepsake_orders_reading_idx
  on public.keepsake_orders(reading_id, created_at desc);

create index if not exists keepsake_orders_customer_idx
  on public.keepsake_orders(customer_id, created_at desc);

create or replace function public.set_keepsake_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists keepsake_orders_updated_at on public.keepsake_orders;
create trigger keepsake_orders_updated_at
before update on public.keepsake_orders
for each row execute procedure public.set_keepsake_orders_updated_at();

alter table public.keepsake_orders enable row level security;

drop policy if exists "keepsake orders are admin-only" on public.keepsake_orders;
create policy "keepsake orders are admin-only"
on public.keepsake_orders
for select
using (false);
