/**
 * Database schema for CHANG SUEK RUN (Postgres / Supabase). Idempotent.
 * Lives in its own schema "csr" which is NOT exposed through Supabase's public API;
 * RLS is enabled on every table with no policies, so only the server's own
 * database connection (DATABASE_URL) can read or write.
 */
export const SCHEMA_SQL = `
create schema if not exists csr;

create sequence if not exists csr.order_seq;

create table if not exists csr.orders (
  order_id            text primary key,
  token_hash          text not null,
  route_id            text not null,
  payment_status      text not null,
  verification_status text not null,
  bib_number          text not null default '',
  omise_charge_id     text,
  created_at          timestamptz not null default now(),
  data                jsonb not null
);
create unique index if not exists orders_bib_uidx on csr.orders (bib_number) where bib_number <> '';
create index if not exists orders_charge_idx on csr.orders (omise_charge_id);
create index if not exists orders_created_idx on csr.orders (created_at desc);

create table if not exists csr.bib_counters (
  route_id text primary key,
  last_seq integer not null default 0
);
insert into csr.bib_counters (route_id, last_seq)
  values ('10km', 0), ('5km', 0), ('3km', 0), ('1km', 0)
  on conflict (route_id) do nothing;

create table if not exists csr.used_refs (
  ref        text primary key,
  order_id   text,
  created_at timestamptz not null default now()
);

create table if not exists csr.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists csr.rate_hits (
  key text not null,
  at  timestamptz not null default now()
);
create index if not exists rate_hits_key_idx on csr.rate_hits (key, at desc);

create table if not exists csr.login_failures (
  ip           text primary key,
  fails        integer not null default 0,
  first_at     timestamptz not null default now(),
  locked_until timestamptz
);

create table if not exists csr.sponsor_codes (
  code         text primary key,
  sponsor_name text not null,
  max_uses     integer,                       -- null = unlimited
  used_count   integer not null default 0,
  active       boolean not null default true,
  note         text not null default '',
  created_at   timestamptz not null default now()
);

alter table csr.orders          enable row level security;
alter table csr.bib_counters    enable row level security;
alter table csr.used_refs       enable row level security;
alter table csr.settings        enable row level security;
alter table csr.rate_hits       enable row level security;
alter table csr.login_failures  enable row level security;
alter table csr.sponsor_codes   enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on schema csr from anon, authenticated;
    revoke all on all tables in schema csr from anon, authenticated;
    revoke all on all sequences in schema csr from anon, authenticated;
  end if;
end $$;
`;
