import { describe, expect, it } from 'vitest';
import { analyticsAdminState, parseAdminEmails } from '@/lib/analytics/admin';

const allowList = parseAdminEmails(' Owner@Example.com , ');
const verified = '2026-11-01T00:00:00Z';

describe('analytics admin access', () => {
  it('parses a comma-separated, case-insensitive allow-list', () => {
    expect([...allowList]).toEqual(['owner@example.com']);
    expect(parseAdminEmails(undefined).size).toBe(0);
  });

  it('allows only a verified email on the allow-list', () => {
    expect(
      analyticsAdminState(
        { email: 'OWNER@example.com', email_confirmed_at: verified },
        allowList,
      ),
    ).toEqual({ status: 'admin', email: 'owner@example.com' });
    expect(
      analyticsAdminState(
        { email: 'someone@example.com', email_confirmed_at: verified },
        allowList,
      ).status,
    ).toBe('forbidden');
    expect(
      analyticsAdminState(
        { email: 'owner@example.com', email_confirmed_at: undefined },
        allowList,
      ).status,
    ).toBe('forbidden');
  });

  it('reports signed-out visitors and an unconfigured allow-list', () => {
    expect(analyticsAdminState(null, allowList).status).toBe('signed-out');
    expect(
      analyticsAdminState(
        { email: 'owner@example.com', email_confirmed_at: verified },
        new Set(),
      ).status,
    ).toBe('unavailable');
  });
});
