import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/social-card/v2'],
      disallow: ['/api/', '/auth/'],
    },
    sitemap: new URL('/sitemap.xml', siteConfig.siteUrl).toString(),
    host: new URL(siteConfig.siteUrl).origin,
  };
}
