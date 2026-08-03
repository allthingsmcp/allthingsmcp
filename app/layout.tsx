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
  openGraph: {
    title: 'All Things MCP',
    description: siteConfig.description,
    type: 'website',
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
