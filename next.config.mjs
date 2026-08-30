import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedEnv: true,
  },
  async redirects() {
    return [
      { source: '/library', destination: '/guides', permanent: true },
      {
        source: '/library/guides/what-is-mcp',
        destination: '/blog/what-is-mcp',
        permanent: true,
      },
      {
        source: '/library/guides/mcp-architecture',
        destination: '/blog/mcp-architecture',
        permanent: true,
      },
      {
        source: '/library/guides/mcp-authorization-explained',
        destination: '/blog/mcp-authorization-explained',
        permanent: true,
      },
      {
        source: '/library/guides/mcp-in-production',
        destination: '/blog/mcp-in-production',
        permanent: true,
      },
      {
        source: '/library/tutorials/minimal-server',
        destination: '/guides/build-a-minimal-mcp-server',
        permanent: true,
      },
      {
        source: '/library/learning-paths/fundamentals',
        destination: '/guides/mcp-fundamentals',
        permanent: true,
      },
      {
        source: '/library/lessons/participants',
        destination: '/guides/mcp-fundamentals#identify-participants',
        permanent: true,
      },
      {
        source: '/library/spec-watch/:slug',
        destination: '/spec-watch/:slug',
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
