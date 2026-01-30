create table if not exists public.canva_tokens (
  id text primary key,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_canva_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists canva_tokens_updated_at on public.canva_tokens;
create trigger canva_tokens_updated_at
before update on public.canva_tokens
for each row execute procedure public.set_canva_tokens_updated_at();
