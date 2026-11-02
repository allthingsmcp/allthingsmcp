import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { contentSchema } from '../lib/content-schema';
import { validateMdxBody, withoutFencedCode } from '../lib/mdx-validation';
import {
  interactiveGuideDefinitions,
  interactiveGuideScenes,
  type InteractiveGuideId,
  type InteractiveGuideScene,
} from '../lib/interactive-guides';

const root = process.cwd();
const files = await fg('content/**/*.{md,mdx}', { cwd: root, absolute: true });
const allowedComponents = new Set([
  'Callout',
  'Steps',
  'Tabs',
  'Checklist',
  'CardGrid',
  'MetadataPanel',
  'ProtocolDiagram',
  'InteractiveGuideBlock',
]);
const contentDirectories: Record<string, string[]> = {
  guide: ['guides'],
  'guide-step': ['guide-steps'],
  article: ['blog'],
  'learning-path': ['learning-paths'],
  lesson: ['lessons'],
  glossary: ['glossary'],
  ecosystem: ['ecosystem'],
  tool: ['tools'],
  'spec-release': ['spec-watch'],
  'spec-proposal': ['spec-watch'],
};
const slugs = new Map<string, string>();
const knownLibraryUrls = new Set(
  files.map(
    (file) =>
      `/library/${path
        .relative(path.join(root, 'content'), file)
        .replace(/\.(md|mdx)$/, '')
        .split(path.sep)
        .join('/')}`,
  ),
);
const errors: string[] = [];
const guides = new Map<
  string,
  {
    file: string;
    steps: Array<{ id: string }>;
    interactiveGuideId?: InteractiveGuideId;
  }
>();
const guideSteps: Array<{
  file: string;
  guideSlug: string;
  stepId: string;
  order: number;
  interactiveScenes: InteractiveGuideScene[];
}> = [];

for (const file of files) {
  const relative = path.relative(root, file);
  const raw = await readFile(file, 'utf8');
  const parsed = matter(raw);
  const mdx = withoutFencedCode(parsed.content);
  const result = contentSchema.safeParse(parsed.data);
  if (!result.success) {
    for (const issue of result.error.issues)
      errors.push(
        `${relative}: ${issue.path.join('.') || 'frontmatter'} — ${issue.message}`,
      );
  } else if (result.data.contentType === 'guide') {
    const guideSlug = path.basename(file).replace(/\.(md|mdx)$/, '');
    guides.set(guideSlug, {
      file: relative,
      steps: result.data.guideSteps ?? [],
      interactiveGuideId: result.data.interactiveGuideId,
    });
  } else if (
    result.data.contentType === 'guide-step' &&
    result.data.guideSlug &&
    result.data.guideStepId &&
    result.data.guideStepOrder
  ) {
    const scenes = Array.from(
      mdx.matchAll(/<InteractiveGuideBlock\s+scene="([^"]+)"\s*\/>/g),
    ).map((match) => match[1]);
    const invalidScene = scenes.find(
      (scene) =>
        !interactiveGuideScenes.includes(scene as InteractiveGuideScene),
    );
    if (invalidScene) {
      errors.push(
        `${relative}: unknown interactive Guide scene ${invalidScene}`,
      );
    }
    if (mdx.includes('<InteractiveGuideBlock') && scenes.length === 0) {
      errors.push(
        `${relative}: InteractiveGuideBlock requires a literal scene attribute`,
      );
    }
    guideSteps.push({
      file: relative,
      guideSlug: result.data.guideSlug,
      stepId: result.data.guideStepId,
      order: result.data.guideStepOrder,
      interactiveScenes: scenes.filter((scene) =>
        interactiveGuideScenes.includes(scene as InteractiveGuideScene),
      ) as InteractiveGuideScene[],
    });
  }

  if (result.success) {
    const directory = path
      .relative(path.join(root, 'content'), file)
      .split(path.sep)[0];
    const allowed = contentDirectories[result.data.contentType];
    if (allowed && !allowed.includes(directory)) {
      errors.push(
        `${relative}: contentType "${result.data.contentType}" belongs in content/${allowed[0]}/, not content/${directory}/`,
      );
    }
  }

  const slug = path
    .relative(path.join(root, 'content'), file)
    .replace(/\.(md|mdx)$/, '')
    .toLowerCase()
    .split(path.sep)
    .join('/');
  const duplicate = slugs.get(slug);
  if (duplicate) errors.push(`${relative}: duplicate slug with ${duplicate}`);
  slugs.set(slug, relative);

  for (const error of validateMdxBody(parsed.content, allowedComponents))
    errors.push(`${relative}: ${error}`);

  for (const match of mdx.matchAll(/\]\((\/[\w\-/.#]+)\)/g)) {
    const target = match[1].split('#')[0].replace(/\/$/, '');
    if (target.startsWith('/library/') && !knownLibraryUrls.has(target))
      errors.push(`${relative}: broken internal reference ${target}`);
  }
}

for (const step of guideSteps) {
  const guide = guides.get(step.guideSlug);
  if (!guide) {
    errors.push(`${step.file}: unknown parent guide ${step.guideSlug}`);
    continue;
  }
  if (step.interactiveScenes.length && !guide.interactiveGuideId) {
    errors.push(
      `${step.file}: interactive blocks require interactiveGuideId on ${guide.file}`,
    );
  }
  if (
    guide.interactiveGuideId &&
    !interactiveGuideDefinitions[guide.interactiveGuideId]
  ) {
    errors.push(
      `${guide.file}: unknown interactive Guide ${guide.interactiveGuideId}`,
    );
  }
  const manifestIndex = guide.steps.findIndex(
    (item) => item.id === step.stepId,
  );
  if (manifestIndex === -1) {
    errors.push(
      `${step.file}: step ${step.stepId} is missing from ${guide.file}'s guideSteps`,
    );
  } else if (step.order !== manifestIndex + 1) {
    errors.push(
      `${step.file}: guideStepOrder must be ${manifestIndex + 1} to match ${guide.file}`,
    );
  }
}

for (const [guideSlug, guide] of guides) {
  for (const step of guide.steps) {
    if (
      !guideSteps.some(
        (candidate) =>
          candidate.guideSlug === guideSlug && candidate.stepId === step.id,
      )
    ) {
      errors.push(`${guide.file}: missing guide-step document for ${step.id}`);
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} issue(s):\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated ${files.length} content documents with unique slugs and safe MDX.`,
);
