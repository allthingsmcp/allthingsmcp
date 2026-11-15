-- First-party analytics. The website writes one row per page view or custom
-- event through its collector route, using the service role. Browser clients
-- have no access to the table or the reporting functions.
--
-- Privacy: no cookies, no IP addresses and no user-entered text are stored.
-- `visitor` is a salted hash that changes every UTC day, so a visit is
-- "one visitor on one UTC day".

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (name ~ '^[a-z][a-z0-9_]{0,47}$'),
  hostname text not null check (char_length(hostname) <= 253),
  path text not null check (char_length(path) <= 1024),
  referrer text check (char_length(referrer) <= 1024),
  referrer_host text check (char_length(referrer_host) <= 253),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  utm_term text check (char_length(utm_term) <= 100),
  utm_content text check (char_length(utm_content) <= 100),
  country text check (country ~ '^[A-Z]{2}$'),
  device text check (device in ('desktop', 'mobile', 'tablet')),
  browser text check (char_length(browser) <= 64),
  os text check (char_length(os) <= 64),
  visitor text not null check (visitor ~ '^[0-9a-f]{16,64}$'),
  props jsonb check (props is null or jsonb_typeof(props) = 'object')
);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_name_created_idx
  on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_path_created_idx
  on public.analytics_events (path, created_at desc);

alter table public.analytics_events enable row level security;

revoke all on public.analytics_events from public, anon, authenticated;
grant select, insert on public.analytics_events to service_role;

comment on table public.analytics_events is
  'First-party page views and events. Written and read by the website with the service role only.';

-- Events in a date range, each enriched with its visit (visitor + UTC day):
-- the entry page view's referrer and UTM values, and the visit's totals.
-- Filters is a JSON object; supported keys are listed below. The value
-- "(none)" matches an empty value, for example direct traffic.
create or replace function public.analytics_scope(
  p_from timestamptz,
  p_to timestamptz,
  p_filters jsonb default '{}'::jsonb
)
returns table (
  id bigint,
  created_at timestamptz,
  name text,
  hostname text,
  path text,
  visitor text,
  visit_key text,
  country text,
  device text,
  browser text,
  os text,
  props jsonb,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  entry_path text,
  visit_pageviews bigint,
  visit_events bigint
)
language sql
stable
set search_path = ''
as $$
  with base as (
    select
      e.*,
      e.visitor || ':' || to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD')
        as visit_key
    from public.analytics_events e
    where e.created_at >= p_from and e.created_at < p_to
  ),
  entries as (
    select distinct on (b.visit_key)
      b.visit_key,
      b.referrer_host,
      b.utm_source,
      b.utm_medium,
      b.utm_campaign,
      b.utm_term,
      b.utm_content,
      b.path as entry_path
    from base b
    where b.name = 'pageview'
    order by b.visit_key, b.created_at, b.id
  ),
  totals as (
    select
      b.visit_key,
      count(*) filter (where b.name = 'pageview') as visit_pageviews,
      count(*) filter (where b.name <> 'pageview') as visit_events
    from base b
    group by b.visit_key
  ),
  scoped as (
    select
      b.id, b.created_at, b.name, b.hostname, b.path, b.visitor, b.visit_key,
      b.country, b.device, b.browser, b.os, b.props,
      v.referrer_host, v.utm_source, v.utm_medium, v.utm_campaign,
      v.utm_term, v.utm_content, v.entry_path,
      t.visit_pageviews, t.visit_events
    from base b
    join totals t on t.visit_key = b.visit_key
    left join entries v on v.visit_key = b.visit_key
  )
  select s.*
  from scoped s
  where (p_filters ->> 'hostname' is null or s.hostname = p_filters ->> 'hostname')
    and (p_filters ->> 'path' is null or s.path = p_filters ->> 'path')
    and (p_filters ->> 'entry_path' is null or s.entry_path = p_filters ->> 'entry_path')
    and (p_filters ->> 'event' is null or s.name = p_filters ->> 'event')
    and (p_filters ->> 'country' is null
      or coalesce(s.country, '(none)') = p_filters ->> 'country')
    and (p_filters ->> 'device' is null
      or coalesce(s.device, '(none)') = p_filters ->> 'device')
    and (p_filters ->> 'browser' is null
      or coalesce(s.browser, '(none)') = p_filters ->> 'browser')
    and (p_filters ->> 'os' is null
      or coalesce(s.os, '(none)') = p_filters ->> 'os')
    and (p_filters ->> 'referrer_host' is null
      or coalesce(s.referrer_host, '(none)') = p_filters ->> 'referrer_host')
    and (p_filters ->> 'utm_source' is null
      or coalesce(s.utm_source, '(none)') = p_filters ->> 'utm_source')
    and (p_filters ->> 'utm_medium' is null
      or coalesce(s.utm_medium, '(none)') = p_filters ->> 'utm_medium')
    and (p_filters ->> 'utm_campaign' is null
      or coalesce(s.utm_campaign, '(none)') = p_filters ->> 'utm_campaign')
    and (p_filters ->> 'utm_term' is null
      or coalesce(s.utm_term, '(none)') = p_filters ->> 'utm_term')
    and (p_filters ->> 'utm_content' is null
      or coalesce(s.utm_content, '(none)') = p_filters ->> 'utm_content');
$$;

-- Headline numbers. A bounce is a visit with one page view and no events.
create or replace function public.analytics_summary(
  p_from timestamptz,
  p_to timestamptz,
  p_filters jsonb default '{}'::jsonb
)
returns table (
  visitors bigint,
  visits bigint,
  pageviews bigint,
  events bigint,
  bounces bigint
)
language sql
stable
set search_path = ''
as $$
  with s as (
    select * from public.analytics_scope(p_from, p_to, p_filters)
  ),
  visits as (
    select distinct visit_key, visit_pageviews, visit_events
    from s
    where s.name = 'pageview'
  )
  select
    (select count(distinct visitor) from s),
    (select count(*) from visits),
    (select count(*) from s where s.name = 'pageview'),
    (select count(*) from s where s.name <> 'pageview'),
    (select count(*) from visits where visit_pageviews = 1 and visit_events = 0);
$$;

-- Visitors and page views per hour, day, week or month (UTC), gaps filled.
create or replace function public.analytics_timeseries(
  p_from timestamptz,
  p_to timestamptz,
  p_interval text,
  p_filters jsonb default '{}'::jsonb
)
returns table (bucket timestamptz, visitors bigint, pageviews bigint)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
begin
  if p_interval not in ('hour', 'day', 'week', 'month') then
    raise exception 'Unsupported interval: %', p_interval;
  end if;

  return query
  with s as (
    select * from public.analytics_scope(p_from, p_to, p_filters)
  ),
  buckets as (
    select generate_series(
      date_trunc(p_interval, p_from at time zone 'UTC'),
      date_trunc(p_interval, (p_to - interval '1 microsecond') at time zone 'UTC'),
      ('1 ' || p_interval)::interval
    ) as b
  ),
  counted as (
    select
      date_trunc(p_interval, s.created_at at time zone 'UTC') as b,
      count(distinct s.visitor) as visitors,
      count(*) filter (where s.name = 'pageview') as pageviews
    from s
    group by 1
  )
  select
    buckets.b at time zone 'UTC',
    coalesce(counted.visitors, 0),
    coalesce(counted.pageviews, 0)
  from buckets
  left join counted on counted.b = buckets.b
  order by buckets.b;
end;
$$;

-- Top values for one dimension. The dimension is chosen from a fixed list.
-- For "event", only custom events are counted; for "prop", the values of one
-- property of one event (p_event, p_prop).
create or replace function public.analytics_breakdown(
  p_from timestamptz,
  p_to timestamptz,
  p_dimension text,
  p_filters jsonb default '{}'::jsonb,
  p_limit integer default 10,
  p_event text default null,
  p_prop text default null
)
returns table (value text, visitors bigint, pageviews bigint, events bigint)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
begin
  if p_dimension not in (
    'hostname', 'path', 'entry_path', 'referrer_host', 'utm_source',
    'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'country',
    'device', 'browser', 'os', 'event', 'prop'
  ) then
    raise exception 'Unsupported dimension: %', p_dimension;
  end if;

  return query
  with s as (
    select * from public.analytics_scope(p_from, p_to, p_filters)
  ),
  valued as (
    select
      case p_dimension
        when 'hostname' then s.hostname
        when 'path' then s.path
        when 'entry_path' then s.entry_path
        when 'referrer_host' then s.referrer_host
        when 'utm_source' then s.utm_source
        when 'utm_medium' then s.utm_medium
        when 'utm_campaign' then s.utm_campaign
        when 'utm_term' then s.utm_term
        when 'utm_content' then s.utm_content
        when 'country' then s.country
        when 'device' then s.device
        when 'browser' then s.browser
        when 'os' then s.os
        when 'event' then s.name
        when 'prop' then s.props ->> p_prop
      end as value,
      s.visitor,
      s.name
    from s
    where (p_dimension not in ('event', 'prop') or s.name <> 'pageview')
      and (p_dimension <> 'prop' or s.name = p_event)
      and (p_dimension not in ('hostname', 'path', 'entry_path')
        or s.name = 'pageview')
  )
  select
    coalesce(valued.value, '(none)'),
    count(distinct valued.visitor),
    count(*) filter (where valued.name = 'pageview'),
    count(*) filter (where valued.name <> 'pageview')
  from valued
  group by 1
  order by 2 desc, 3 desc, 4 desc, 1
  limit least(greatest(p_limit, 1), 100);
end;
$$;

revoke all on function public.analytics_scope(timestamptz, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function public.analytics_summary(timestamptz, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function public.analytics_timeseries(timestamptz, timestamptz, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.analytics_breakdown(timestamptz, timestamptz, text, jsonb, integer, text, text)
  from public, anon, authenticated;

grant execute on function public.analytics_scope(timestamptz, timestamptz, jsonb)
  to service_role;
grant execute on function public.analytics_summary(timestamptz, timestamptz, jsonb)
  to service_role;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text, jsonb)
  to service_role;
grant execute on function public.analytics_breakdown(timestamptz, timestamptz, text, jsonb, integer, text, text)
  to service_role;
