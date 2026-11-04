-- Runner accounts for the sign-up / login system (additive: no existing table is changed).
-- The server also creates this on first use, so applying it by hand is optional.
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
alter table csr.runners enable row level security;
