import type { Metadata } from 'next';
import { Geist, Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { NextProvider } from 'fumadocs-core/framework/next';
import { PrivacyAnalytics } from '@/components/privacy-analytics';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/lib/config';
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
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/brand/favicon.svg',
    apple: [
      {
        url: '/brand/apple-touch-icon.png',
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
        url: '/brand/social-card.png',
        width: 1200,
        height: 630,
        alt: 'All Things MCP — Learn. Build. Ship with MCP.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Things MCP',
    description: siteConfig.description,
    images: ['/brand/social-card.png'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable} ${mono.variable}`}
    >
      <body>
        <NextProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <PrivacyAnalytics />
        </NextProvider>
      </body>
    </html>
  );
}
