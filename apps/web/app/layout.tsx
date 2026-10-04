import type { Metadata } from 'next';
import { Geist, Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { NextProvider } from 'fumadocs-core/framework/next';
import { PrivacyAnalytics } from '@/components/privacy-analytics';
import { AuthDialogProvider } from '@/components/auth-dialog';
import { SearchDialogProvider } from '@/components/search-dialog';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { GuideProgressProvider } from '@/components/use-guide-progress';
import { AuthSessionProvider } from '@/lib/auth-client';
import { siteConfig } from '@/lib/config';
import { brandAssets, brandIdentity } from '@/lib/brand';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: 'All Things MCP', template: '%s · All Things MCP' },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: brandAssets.favicon, type: 'image/svg+xml' },
      { url: brandAssets.favicon32, sizes: '32x32', type: 'image/png' },
    ],
    shortcut: brandAssets.favicon,
    apple: [
      {
        url: brandAssets.appleTouch,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    title: 'All Things MCP',
    description: siteConfig.description,
    type: 'website',
    siteName: 'All Things MCP',
    images: [
      {
        url: brandAssets.socialCard,
        width: 1200,
        height: 630,
        alt: `${brandIdentity.name} — ${brandIdentity.positioning}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Things MCP',
    description: siteConfig.description,
    images: [brandAssets.socialCard],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${inter.variable} ${mono.variable}`}
    >
      <body>
        <NextProvider>
          <AuthSessionProvider>
            <AuthDialogProvider>
              <GuideProgressProvider>
                <SearchDialogProvider>
                  <SiteHeader />
                  {children}
                  <SiteFooter />
                  <PrivacyAnalytics />
                </SearchDialogProvider>
              </GuideProgressProvider>
            </AuthDialogProvider>
          </AuthSessionProvider>
        </NextProvider>
      </body>
    </html>
  );
}
