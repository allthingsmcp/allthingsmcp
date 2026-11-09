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
  // Config-level redirects. Other redirect routes (/guide, /search) are
  // intentionally kept as page files under app/.
  async redirects() {
    return [
      { source: '/all', destination: '/', permanent: true },
      // The minimal-server guide was removed; keep old links from 404ing.
      {
        source: '/library/tutorials/minimal-server',
        destination: '/guides',
        permanent: true,
      },
      {
        source: '/guides/build-a-minimal-mcp-server/:path*',
        destination: '/guides',
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
