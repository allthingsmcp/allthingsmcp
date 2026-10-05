import type { ContentFrontmatter } from '@/lib/content-schema';
import { siteConfig } from '@/lib/config';

function componentItems(name: string, attributes: string) {
  if (name === 'Checklist') {
    return [...attributes.matchAll(/'([^']+)'/g)]
      .map((match) => `- ${match[1]}`)
      .join('\n');
  }

  const items = [...attributes.matchAll(/\{([^{}]*)\}/g)].map((match) => {
    const value = match[1];
    const field = (key: string) =>
      value.match(new RegExp(`\\b${key}:\\s*'([^']*)'`))?.[1];
    const title = field('title') ?? field('label');
    if (!title) return null;
    const description = field('description') ?? field('content');
    const href = field('href');
    const label = href
      ? `[${title}](${new URL(href, siteConfig.siteUrl)})`
      : `**${title}**`;
    return `${label}${description ? ` — ${description}` : ''}`;
  });

  return items
    .filter((item): item is string => Boolean(item))
    .map((item, index) => `${name === 'Steps' ? `${index + 1}.` : '-'} ${item}`)
    .join('\n');
}

function plainMarkdown(body: string) {
  const sections: { code: boolean; lines: string[] }[] = [];
  let fence: { marker: string; length: number } | null = null;

  for (const line of body.split('\n')) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    const code = Boolean(fence || marker);
    if (sections.at(-1)?.code !== code) sections.push({ code, lines: [] });
    sections.at(-1)!.lines.push(line);

    if (!marker) continue;
    if (!fence) {
      fence = { marker: marker[1][0], length: marker[1].length };
    } else if (
      marker[1][0] === fence.marker &&
      marker[1].length >= fence.length
    ) {
      fence = null;
    }
  }

  return sections
    .map(({ code, lines }) => {
      const value = lines.join('\n');
      if (code) return value;
      return value
        .replace(/ \[#[-a-z0-9]+\]$/gim, '')
        .replace(
          /<InteractiveGuideBlock\b[^>]*\/>/g,
          '\n> Interactive activity: complete this exercise on the source page.\n',
        )
        .replace(
          /<ProtocolDiagram\b([^>]*?)\/>/g,
          (_match, attributes: string) => {
            const label = attributes.match(/\blabel="([^"]+)"/)?.[1];
            return `\n> Protocol diagram${label ? `: ${label}` : ': view the illustration on the source page.'}\n`;
          },
        )
        .replace(
          /<(Checklist|Steps|CardGrid|Tabs)\b([\s\S]*?)\/>/g,
          (_match, name: string, attributes: string) =>
            `\n${componentItems(name, attributes)}\n`,
        )
        .replace(/<Callout\b([^>]*)>/g, (_match, attributes: string) => {
          const title = attributes.match(/\btitle="([^"]+)"/)?.[1];
          return title ? `\n**${title}**\n\n` : '\n';
        })
        .replace(/<\/Callout>/g, '')
        .replace(/<\/?MetadataPanel>/g, '')
        .replace(
          /\]\((\/[^)]+)\)/g,
          (_match, path: string) =>
            `](${new URL(path, siteConfig.siteUrl).toString()})`,
        );
    })
    .join('\n')
    .trim();
}

export function formatContentMarkdown({
  data,
  pathname,
  body,
  guide,
}: {
  data: ContentFrontmatter;
  pathname: string;
  body: string;
  guide?: ContentFrontmatter;
}) {
  const url = new URL(pathname, siteConfig.siteUrl).toString();
  const metadata = [
    `# ${data.title}`,
    data.description,
    `Source: ${url}`,
    `Authors: ${data.authors.join(', ')}`,
    data.publishedAt && `Published: ${data.publishedAt}`,
    `Updated: ${data.updatedAt}`,
    data.specVersion && `MCP specification: ${data.specVersion}`,
    data.lastVerified && `Last verified: ${data.lastVerified}`,
    guide &&
      `Guide: [${guide.title}](${new URL(`/guides/${data.guideSlug}`, siteConfig.siteUrl)})`,
  ].filter(Boolean);

  const context =
    data.contentType === 'guide'
      ? [
          data.outcome && `## Outcome\n\n${data.outcome}`,
          data.prerequisites?.length &&
            `## Prerequisites\n\n${data.prerequisites.map((item) => `- ${item}`).join('\n')}`,
          data.guideSteps?.length &&
            `## Steps\n\n${data.guideSteps
              .map(
                (step, index) =>
                  `${index + 1}. [${step.title}](${new URL(`${pathname}/${step.id}`, siteConfig.siteUrl)}) — ${step.description}`,
              )
              .join('\n')}`,
          data.guideResources?.length &&
            `## Resources\n\n${data.guideResources
              .map((item) => `- [${item.title}](${item.url})`)
              .join('\n')}`,
        ].filter(Boolean)
      : [];

  return [metadata.join('\n\n'), ...context, plainMarkdown(body)]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}
