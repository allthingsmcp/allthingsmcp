export const siteConfig = {
  name: 'All Things MCP',
  description:
    'Independent guides, tools, and architecture for the Model Context Protocol ecosystem.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  githubRepo:
    process.env.NEXT_PUBLIC_GITHUB_REPO ??
    'https://github.com/allthingsmcp/allthingsmcp',
  substackUrl:
    process.env.NEXT_PUBLIC_SUBSTACK_URL ?? 'https://allthingsmcp.substack.com',
  substackEmbedUrl: process.env.NEXT_PUBLIC_SUBSTACK_EMBED_URL ?? '',
};
