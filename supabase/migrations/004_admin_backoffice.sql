-- Back office: audit log, individual admin accounts, switch-off flag for runner accounts (all additive)
create table if not exists csr.audit_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  actor   text not null,
  role    text not null default '',
  action  text not null,
  target  text not null default '',
  detail  jsonb not null default '{}'::jsonb,
  ip      text not null default ''
);
create index if not exists audit_log_at_idx on csr.audit_log (at desc);
create table if not exists csr.admin_users (
  username      text primary key,
  display_name  text not null default '',
  role          text not null,
  password_hash text not null,
  active        boolean not null default true,
  token_version integer not null default 0,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
alter table csr.runners add column if not exists disabled_at timestamptz;
alter table csr.audit_log enable row level security;
alter table csr.admin_users enable row level security;
