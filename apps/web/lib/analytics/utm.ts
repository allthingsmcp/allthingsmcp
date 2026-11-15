/** Building tagged campaign links for /admin/links. Pure, for tests. */

export const sourcePresets = [
  'newsletter',
  'linkedin',
  'x',
  'bluesky',
  'reddit',
  'hackernews',
  'github',
  'discord',
  'youtube',
];

export const mediumPresets = [
  'social',
  'email',
  'community',
  'referral',
  'paid',
];

/** Lowercase, hyphenated, and short: the form analytics groups reliably. */
export function normaliseUtmValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export type CampaignInput = {
  page: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
};

export type CampaignLink =
  | {
      ok: true;
      url: string;
      values: Required<CampaignInput>;
      external: boolean;
    }
  | { ok: false; error: string };

/**
 * Build the tagged URL. `page` may be a path on the site or a full URL;
 * links to other sites still work, but this site cannot count them.
 */
export function buildCampaignLink(
  input: CampaignInput,
  siteUrl: string,
  siteHosts: string[],
): CampaignLink {
  const values = {
    page: input.page.trim() || '/',
    source: normaliseUtmValue(input.source),
    medium: normaliseUtmValue(input.medium),
    campaign: normaliseUtmValue(input.campaign),
    content: normaliseUtmValue(input.content ?? ''),
    term: normaliseUtmValue(input.term ?? ''),
  };
  if (!values.source) return { ok: false, error: 'Add a source.' };
  if (!values.medium) return { ok: false, error: 'Add a medium.' };
  if (!values.campaign) return { ok: false, error: 'Add a campaign name.' };

  let url: URL;
  try {
    url = new URL(values.page, siteUrl);
  } catch {
    return { ok: false, error: 'Enter a page path or a full URL.' };
  }
  if (!['http:', 'https:'].includes(url.protocol))
    return { ok: false, error: 'Use an http or https link.' };

  for (const key of [...url.searchParams.keys()])
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  url.searchParams.set('utm_source', values.source);
  url.searchParams.set('utm_medium', values.medium);
  url.searchParams.set('utm_campaign', values.campaign);
  if (values.content) url.searchParams.set('utm_content', values.content);
  if (values.term) url.searchParams.set('utm_term', values.term);

  const host = url.hostname.toLowerCase();
  return {
    ok: true,
    url: url.toString(),
    values,
    external: !siteHosts.includes(host),
  };
}

/** Dashboard view for one campaign (and source, when given), all time. */
export function campaignResultsHref(campaign: string, source?: string) {
  const params = new URLSearchParams({ range: 'all', utm_campaign: campaign });
  if (source) params.set('utm_source', source);
  return `/admin/analytics?${params}`;
}
