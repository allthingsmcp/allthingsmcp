// Keep content metadata independent of runtime template imports so Fumadocs
// can load its compiled configuration on every supported Node.js version.
export const interactiveGuideIds = ['building-your-first-mcp-server'] as const;

export type InteractiveGuideId = (typeof interactiveGuideIds)[number];
