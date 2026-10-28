-- Sponsor codes: a sponsor registers with a code and pays nothing (run + concert).
-- Safe to re-run.

create table if not exists csr.sponsor_codes (
  code         text primary key,
  sponsor_name text not null,
  max_uses     integer,                       -- null = unlimited
  used_count   integer not null default 0,
  active       boolean not null default true,
  note         text not null default '',
  created_at   timestamptz not null default now()
);

alter table csr.sponsor_codes enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on csr.sponsor_codes from anon, authenticated;
  end if;
end $$;
