import { Database, MessageSquareText, Wrench } from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import {
  type CapabilityKind,
  type InteractiveGuideScene,
} from '@/lib/interactive-guides';

export type WorkspaceMode = 'visual' | 'code' | 'protocol' | 'client';

export const kindMeta: Record<
  CapabilityKind,
  { label: string; icon: typeof Wrench; className: string }
> = {
  tool: { label: 'Tools', icon: Wrench, className: 'is-tool' },
  resource: {
    label: 'Resources',
    icon: Database,
    className: 'is-resource',
  },
  prompt: {
    label: 'Prompts',
    icon: MessageSquareText,
    className: 'is-prompt',
  },
};

export function collectionFor(
  kind: CapabilityKind,
  server: ReturnType<typeof useInteractiveGuide>['state']['server'],
) {
  return kind === 'tool'
    ? server.tools
    : kind === 'resource'
      ? server.resources
      : server.prompts;
}

export function sceneKind(
  scene: InteractiveGuideScene,
): CapabilityKind | undefined {
  if (scene === 'add-tools') return 'tool';
  if (scene === 'add-resources') return 'resource';
  if (scene === 'add-prompts') return 'prompt';
  return undefined;
}
