create table if not exists public.guide_runs (
  id uuid primary key,
  user_id text not null,
  guide_slug text not null,
  progress jsonb not null,
  simulator_state jsonb,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, guide_slug)
);

create index if not exists guide_runs_user_updated_idx
  on public.guide_runs (user_id, updated_at desc);

alter table public.guide_runs enable row level security;

comment on table public.guide_runs is
  'Durable Guide progress owned by Guide Runtime. Browser clients have no direct table policy.';
