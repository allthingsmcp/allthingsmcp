-- Dashboard additions for first-party analytics:
-- * analytics_timeseries also returns visits and bounces per bucket, so the
--   dashboard can chart bounce rate over time. Its return type changes, so
--   the function is dropped and recreated.
-- * analytics_breakdown gains a "route" dimension that groups dynamic pages
--   (for example /blog/[slug]).

-- Visitors, page views, visits and bounces per hour, day, week or month
-- (UTC), gaps filled. A visit counts in the bucket of its first page view.
drop function if exists public.analytics_timeseries(timestamptz, timestamptz, text, jsonb);
create or replace function public.analytics_timeseries(
  p_from timestamptz,
  p_to timestamptz,
  p_interval text,
  p_filters jsonb default '{}'::jsonb
)
returns table (
  bucket timestamptz,
  visitors bigint,
  pageviews bigint,
  visits bigint,
  bounces bigint
)
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
  ),
  visit_starts as (
    select
      date_trunc(p_interval, min(s.created_at) at time zone 'UTC') as b,
      bool_and(s.visit_pageviews = 1 and s.visit_events = 0) as bounced
    from s
    where s.name = 'pageview'
    group by s.visit_key
  ),
  visit_counts as (
    select
      v.b,
      count(*) as visits,
      count(*) filter (where v.bounced) as bounces
    from visit_starts v
    group by v.b
  )
  select
    buckets.b at time zone 'UTC',
    coalesce(counted.visitors, 0),
    coalesce(counted.pageviews, 0),
    coalesce(visit_counts.visits, 0),
    coalesce(visit_counts.bounces, 0)
  from buckets
  left join counted on counted.b = buckets.b
  left join visit_counts on visit_counts.b = buckets.b
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
    'hostname', 'path', 'route', 'entry_path', 'referrer_host', 'utm_source',
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
        -- Dynamic routes in apps/web/app, grouped like a route table.
        when 'route' then case
          when s.path ~ '^/guides/[^/]+/[^/]+$' then '/guides/[slug]/[step]'
          when s.path ~ '^/guides/[^/]+$' then '/guides/[slug]'
          when s.path ~ '^/blog/[^/]+$' then '/blog/[slug]'
          when s.path ~ '^/authors/[^/]+$' then '/authors/[slug]'
          when s.path ~ '^/library/.+$' then '/library/[...slug]'
          else s.path
        end
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
      and (p_dimension not in ('hostname', 'path', 'route', 'entry_path')
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

revoke all on function public.analytics_timeseries(timestamptz, timestamptz, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.analytics_breakdown(timestamptz, timestamptz, text, jsonb, integer, text, text)
  from public, anon, authenticated;

grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text, jsonb)
  to service_role;
grant execute on function public.analytics_breakdown(timestamptz, timestamptz, text, jsonb, integer, text, text)
  to service_role;
