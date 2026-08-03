import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedEnv: true,
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
