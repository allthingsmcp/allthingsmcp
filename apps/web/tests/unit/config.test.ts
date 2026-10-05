import { describe, expect, it } from 'vitest';
import { canonicalSiteUrl } from '@/lib/config';

describe('canonical site URL', () => {
  it('uses www for the production host and preserves local development', () => {
    expect(canonicalSiteUrl('https://allthingsmcp.com')).toBe(
      'https://www.allthingsmcp.com',
    );
    expect(canonicalSiteUrl('https://www.allthingsmcp.com')).toBe(
      'https://www.allthingsmcp.com',
    );
    expect(canonicalSiteUrl('http://localhost:3000')).toBe(
      'http://localhost:3000',
    );
  });
});
