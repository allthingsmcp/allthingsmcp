import { describe, expect, it } from 'vitest';
import {
  buildCampaignLink,
  campaignResultsHref,
  normaliseUtmValue,
} from '@/lib/analytics/utm';

const site = 'https://www.allthingsmcp.com';
const hosts = ['www.allthingsmcp.com', 'allthingsmcp.com'];

describe('campaign links', () => {
  it('normalises values so analytics groups them together', () => {
    expect(normaliseUtmValue('  Tasks Launch!! 2026 ')).toBe(
      'tasks-launch-2026',
    );
    expect(normaliseUtmValue('LinkedIn')).toBe('linkedin');
  });

  it('tags a site path with the UTM parameters', () => {
    const link = buildCampaignLink(
      {
        page: '/blog/what-is-mcp',
        source: 'LinkedIn',
        medium: 'social',
        campaign: 'What is MCP',
        content: 'Carousel',
      },
      site,
      hosts,
    );
    expect(link).toMatchObject({
      ok: true,
      external: false,
      url: 'https://www.allthingsmcp.com/blog/what-is-mcp?utm_source=linkedin&utm_medium=social&utm_campaign=what-is-mcp&utm_content=carousel',
    });
  });

  it('replaces existing UTM values and keeps other query parameters', () => {
    const link = buildCampaignLink(
      {
        page: 'https://allthingsmcp.com/guides?tab=all&utm_source=old',
        source: 'newsletter',
        medium: 'email',
        campaign: 'weekly',
      },
      site,
      hosts,
    );
    expect(link.ok && link.url).toBe(
      'https://allthingsmcp.com/guides?tab=all&utm_source=newsletter&utm_medium=email&utm_campaign=weekly',
    );
  });

  it('flags links to other sites and rejects incomplete input', () => {
    const external = buildCampaignLink(
      {
        page: 'https://example.com/',
        source: 'x',
        medium: 'social',
        campaign: 'c',
      },
      site,
      hosts,
    );
    expect(external.ok && external.external).toBe(true);
    expect(
      buildCampaignLink(
        { page: '/', source: '', medium: 'social', campaign: 'c' },
        site,
        hosts,
      ),
    ).toEqual({ ok: false, error: 'Add a source.' });
    expect(
      buildCampaignLink(
        {
          page: 'javascript:alert(1)',
          source: 'x',
          medium: 'y',
          campaign: 'z',
        },
        site,
        hosts,
      ).ok,
    ).toBe(false);
  });

  it('links to the campaign in the dashboard', () => {
    expect(campaignResultsHref('tasks-launch', 'linkedin')).toBe(
      '/admin/analytics?range=all&utm_campaign=tasks-launch&utm_source=linkedin',
    );
  });
});
