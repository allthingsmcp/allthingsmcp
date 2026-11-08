// Reviewed cover scenes a blog post may reference with `coverScene`.
// Scene markup lives in components/cover-scenes.tsx, never in MDX.
export const coverSceneIds = ['tasks', 'tool-call'] as const;

export type CoverSceneId = (typeof coverSceneIds)[number];
