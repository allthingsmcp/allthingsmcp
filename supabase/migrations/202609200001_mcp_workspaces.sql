create table if not exists public.mcp_workspaces (
  id uuid primary key,
  public_id uuid not null unique,
  owner_user_id text,
  anonymous_credential_hash text,
  guide_slug text not null,
  template_id text not null,
  template_version integer not null check (template_version > 0),
  configuration jsonb not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  revision integer not null default 1 check (revision > 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (owner_user_id is null and anonymous_credential_hash is not null and expires_at is not null)
    or (owner_user_id is not null and expires_at is null)
  )
);

create unique index if not exists mcp_workspaces_owner_guide_idx
  on public.mcp_workspaces (owner_user_id, guide_slug)
  where owner_user_id is not null;
create index if not exists mcp_workspaces_expiry_idx
  on public.mcp_workspaces (expires_at)
  where expires_at is not null;

create table if not exists public.mcp_access_tokens (
  id uuid primary key,
  workspace_id uuid not null references public.mcp_workspaces (id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mcp_protocol_events (
  id uuid primary key,
  workspace_id uuid not null references public.mcp_workspaces (id) on delete cascade,
  sequence integer not null,
  method text not null,
  status text not null check (status in ('request', 'response', 'error')),
  request jsonb not null,
  response jsonb not null,
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default now()
);
create index if not exists mcp_protocol_events_workspace_idx
  on public.mcp_protocol_events (workspace_id, created_at desc);

create table if not exists public.mcp_provider_cache (
  cache_key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mcp_usage_windows (
  scope text not null,
  scope_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  primary key (scope, scope_key, window_started_at)
);
create index if not exists mcp_usage_windows_expiry_idx
  on public.mcp_usage_windows (expires_at);

alter table public.mcp_workspaces enable row level security;
alter table public.mcp_access_tokens enable row level security;
alter table public.mcp_protocol_events enable row level security;
alter table public.mcp_provider_cache enable row level security;
alter table public.mcp_usage_windows enable row level security;

comment on table public.mcp_workspaces is
  'Declarative MCP configurations owned exclusively by Guide Runtime.';
comment on table public.mcp_protocol_events is
  'Bounded, redacted traces from the first-party Guide client only.';
