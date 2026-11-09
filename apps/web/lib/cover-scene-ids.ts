// Reviewed cover scenes a blog post or guide may reference with `coverScene`.
// Scene markup lives in components/cover-scenes.tsx, never in MDX.
export const coverSceneIds = ['tasks', 'tool-call', 'server-build'] as const;

export type CoverSceneId = (typeof coverSceneIds)[number];
