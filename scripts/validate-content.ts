import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { contentSchema } from '../lib/content-schema';

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
]);
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
  { file: string; steps: Array<{ id: string }> }
>();
const guideSteps: Array<{
  file: string;
  guideSlug: string;
  stepId: string;
  order: number;
}> = [];

for (const file of files) {
  const relative = path.relative(root, file);
  const raw = await readFile(file, 'utf8');
  const parsed = matter(raw);
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
    });
  } else if (
    result.data.contentType === 'guide-step' &&
    result.data.guideSlug &&
    result.data.guideStepId &&
    result.data.guideStepOrder
  ) {
    guideSteps.push({
      file: relative,
      guideSlug: result.data.guideSlug,
      stepId: result.data.guideStepId,
      order: result.data.guideStepOrder,
    });
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

  if (/^(?:import|export)\s/m.test(parsed.content))
    errors.push(`${relative}: MDX imports and exports are not allowed`);
  for (const match of parsed.content.matchAll(/<\/?([A-Z][A-Za-z0-9]*)\b/g)) {
    if (!allowedComponents.has(match[1]))
      errors.push(`${relative}: unapproved MDX component <${match[1]}>`);
  }

  const withoutApprovedArrays = parsed.content.replace(
    /items=\{\[[\s\S]*?\]\}/g,
    '',
  );
  if (
    /\{\s*(?:\([^)]*\)\s*=>|function\b|async\b|await\b|new\s+|[A-Za-z_$][\w$]*\s*\()/m.test(
      withoutApprovedArrays,
    )
  ) {
    errors.push(
      `${relative}: executable JavaScript is not allowed in contributed MDX`,
    );
  }

  for (const match of parsed.content.matchAll(/\]\((\/[\w\-/.#]+)\)/g)) {
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
