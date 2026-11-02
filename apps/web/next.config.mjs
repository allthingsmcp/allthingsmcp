import { createMDX } from 'fumadocs-mdx/next';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  turbopack: {
    root: fileURLToPath(new URL('../..', import.meta.url)),
  },
  experimental: {
    typedEnv: true,
  },
  // Legacy and convenience URLs. Keep redirect-only routes here instead of
  // adding page files that only call redirect().
  async redirects() {
    return [
      // /guides and /blog are intentional full-listing landing pages that sit
      // behind the home page's #guides and #blog sections.
      { source: '/guide', destination: '/guides', permanent: true },
      { source: '/all', destination: '/', permanent: true },
      // The footer links to /search; the overlay is part of the page shell.
      { source: '/search', destination: '/?search=1', permanent: false },
      {
        source: '/library/tutorials/minimal-server',
        destination: '/guides/build-a-minimal-mcp-server',
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
