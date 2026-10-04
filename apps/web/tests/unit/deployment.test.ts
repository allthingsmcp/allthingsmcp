import { describe, expect, it } from 'vitest';
import { isProductionDeployment } from '@/lib/deployment';

describe('deployment visibility', () => {
  it('identifies Vercel production without hiding routes in previews', () => {
    expect(
      isProductionDeployment({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }),
    ).toBe(true);
    expect(
      isProductionDeployment({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(false);
  });

  it('treats a standalone production build as production', () => {
    expect(
      isProductionDeployment({
        NODE_ENV: 'production',
        VERCEL_ENV: undefined,
      }),
    ).toBe(true);
    expect(
      isProductionDeployment({
        NODE_ENV: 'development',
        VERCEL_ENV: undefined,
      }),
    ).toBe(false);
  });
});
