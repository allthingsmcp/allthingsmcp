-- Campaign attribution fix for first-party analytics.
-- A visit (one visitor on one UTC day) used to take its referrer and UTM
-- values from its first page view only, so a visitor who browsed the site
-- earlier in the day and later arrived through a campaign link was counted
-- as direct traffic. The visit's source is now its first page view that
-- arrived with a referrer or UTM values. The entry page is unchanged.

-- Events in a date range, each enriched with its visit (visitor + UTC day):
-- the visit's source (first page view with a referrer or UTM values), its
-- entry page, and its totals.
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
  -- The visit's source is its first page view that arrived with a referrer
  -- or UTM values, so a campaign click later in the day still counts even
  -- when the visitor had already browsed the site that day.
  sources as (
    select distinct on (b.visit_key)
      b.visit_key,
      b.referrer_host,
      b.utm_source,
      b.utm_medium,
      b.utm_campaign,
      b.utm_term,
      b.utm_content
    from base b
    where b.name = 'pageview'
      and coalesce(
        b.referrer_host, b.utm_source, b.utm_medium, b.utm_campaign,
        b.utm_term, b.utm_content
      ) is not null
    order by b.visit_key, b.created_at, b.id
  ),
  landings as (
    select distinct on (b.visit_key)
      b.visit_key,
      b.path as entry_path
    from base b
    where b.name = 'pageview'
    order by b.visit_key, b.created_at, b.id
  ),
  entries as (
    select
      l.visit_key,
      s.referrer_host,
      s.utm_source,
      s.utm_medium,
      s.utm_campaign,
      s.utm_term,
      s.utm_content,
      l.entry_path
    from landings l
    left join sources s on s.visit_key = l.visit_key
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

revoke all on function public.analytics_scope(timestamptz, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.analytics_scope(timestamptz, timestamptz, jsonb)
  to service_role;
