import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  experimental: {
    typedEnv: true,
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
