import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/'],
    },
    sitemap: new URL('/sitemap.xml', siteConfig.siteUrl).toString(),
    host: new URL(siteConfig.siteUrl).origin,
  };
}
