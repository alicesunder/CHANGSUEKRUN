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

-- Anonymous visitor counting: one row per random browser id per day (Thailand time). No personal data.
create table if not exists csr.visits (
  day      date not null,
  vid      text not null,
  views    integer not null default 1,
  first_at timestamptz not null default now(),
  primary key (day, vid)
);

-- Runner accounts (sign-up / login). Passwords are scrypt hashes; LINE logins have no password.
create table if not exists csr.runners (
  runner_id     text primary key,
  email         text,
  username      text,
  name          text not null default '',
  phone         text not null default '',
  password_hash text,
  line_user_id  text,
  profile       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists runners_email_uidx on csr.runners (email) where email is not null;
create unique index if not exists runners_username_uidx on csr.runners (username) where username is not null;
create unique index if not exists runners_line_uidx on csr.runners (line_user_id) where line_user_id is not null;
create index if not exists orders_runner_idx on csr.orders ((data->>'runnerId')) where data ? 'runnerId';
alter table csr.runners add column if not exists email_verified boolean not null default false;
alter table csr.runners add column if not exists google_id text;
alter table csr.runners add column if not exists facebook_id text;
create unique index if not exists runners_google_uidx on csr.runners (google_id) where google_id is not null;
create unique index if not exists runners_facebook_uidx on csr.runners (facebook_id) where facebook_id is not null;
alter table csr.runners enable row level security;

alter table csr.orders          enable row level security;
alter table csr.bib_counters    enable row level security;
alter table csr.used_refs       enable row level security;
alter table csr.settings        enable row level security;
alter table csr.rate_hits       enable row level security;
alter table csr.login_failures  enable row level security;
alter table csr.sponsor_codes   enable row level security;
alter table csr.visits          enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on schema csr from anon, authenticated;
    revoke all on all tables in schema csr from anon, authenticated;
    revoke all on all sequences in schema csr from anon, authenticated;
  end if;
end $$;
`;
