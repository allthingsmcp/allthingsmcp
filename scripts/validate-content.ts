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

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} issue(s):\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated ${files.length} content documents with unique slugs and safe MDX.`,
);
