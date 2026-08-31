import {
  createSearchAPI,
  type AdvancedIndex,
} from 'fumadocs-core/search/server';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { glossaryTerms } from '@/lib/glossary-data';
import { source } from '@/lib/source';

const searchCategories = [
  'guides',
  'blog',
  'spec-watch',
  'glossary',
  'pages',
] as const;

type SearchCategory = (typeof searchCategories)[number];

type SearchRecord = AdvancedIndex & {
  category: SearchCategory;
  kind: string;
};

const production =
  process.env.VERCEL_ENV === 'production' ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

function canonicalUrl(page: ReturnType<typeof source.getPages>[number]) {
  const data = page.data as ContentFrontmatter;
  if (data.contentType === 'article') return `/blog/${page.slugs.at(-1)}`;
  if (data.contentType === 'guide') return `/guides/${page.slugs.at(-1)}`;
  if (data.contentType === 'guide-step' && data.guideSlug && data.guideStepId) {
    return `/guides/${data.guideSlug}/${data.guideStepId}`;
  }
  if (data.contentType.startsWith('spec-')) {
    return `/spec-watch#${page.slugs.at(-1)}`;
  }
  return page.url;
}

function categoryFor(data: ContentFrontmatter): SearchCategory | undefined {
  if (data.contentType === 'guide' || data.contentType === 'guide-step') {
    return 'guides';
  }
  if (data.contentType === 'article') return 'blog';
  if (data.contentType.startsWith('spec-')) return 'spec-watch';
  return undefined;
}

function kindFor(data: ContentFrontmatter) {
  if (data.contentType === 'guide-step') return 'Guide step';
  if (data.contentType === 'guide') return 'Guide';
  if (data.contentType === 'article') return 'Blog';
  if (data.contentType === 'spec-release') return 'Spec release';
  if (data.contentType === 'spec-proposal') return 'Spec proposal';
  return 'Page';
}

function formatLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function breadcrumbsFor(data: ContentFrontmatter, category: SearchCategory) {
  if (category === 'guides') return [formatLabel(data.section)];
  if (category === 'blog' && data.blogTopic) {
    return [formatLabel(data.blogTopic)];
  }
  if (category === 'spec-watch') return ['Protocol updates'];
  return [];
}

function structure(...content: string[]) {
  return {
    headings: [],
    contents: content.filter(Boolean).map((value) => ({
      heading: undefined,
      content: value,
    })),
  };
}

const contentRecords: SearchRecord[] = source
  .getPages()
  .filter((page) => {
    const data = page.data as ContentFrontmatter;
    return (
      categoryFor(data) !== undefined &&
      (!production || data.status === 'published')
    );
  })
  .map((page) => {
    const data = page.data as ContentFrontmatter;
    const category = categoryFor(data)!;
    const metadata = [
      data.section,
      data.difficulty,
      data.specVersion,
      data.authors.join(' '),
      data.tags.join(' '),
    ]
      .filter(Boolean)
      .join(' ');
    const structuredData = page.data.structuredData ?? structure();

    return {
      id: canonicalUrl(page),
      title: data.title,
      description: data.description,
      breadcrumbs: breadcrumbsFor(data, category),
      tag: category,
      structuredData: {
        headings: structuredData.headings,
        contents: [
          ...structuredData.contents,
          { heading: undefined, content: metadata },
        ],
      },
      url: canonicalUrl(page),
      category,
      kind: kindFor(data),
    };
  });

const glossaryRecords: SearchRecord[] = glossaryTerms.map((term) => ({
  id: `/glossary#${term.term.toLowerCase()}`,
  title: term.term,
  description: term.definition,
  breadcrumbs: ['Glossary', term.category],
  tag: 'glossary',
  structuredData: structure(
    term.definition,
    term.category,
    'MCP glossary term',
  ),
  url: `/glossary#${term.term.toLowerCase()}`,
  category: 'glossary',
  kind: 'Glossary term',
}));

const pageRecords: SearchRecord[] = [
  {
    title: 'All Things MCP',
    description:
      'Independent guides, technical analysis, and specification updates for building with Model Context Protocol.',
    url: '/',
    content:
      'MCP developer field guide newsletter learn build operate secure protocol',
  },
  {
    title: 'MCP Guides',
    description:
      'Outcome-driven, step-by-step guides for learning, building, operating, and securing MCP systems.',
    url: '/guides',
    content: 'guides learn build operate security hands-on tutorials',
  },
  {
    title: 'Blog',
    description:
      'Technical explainers, architecture deep dives, and independent analysis of MCP.',
    url: '/blog',
    content: 'blog articles concepts architecture security production opinion',
  },
  {
    title: 'Spec Watch',
    description:
      'MCP specification releases, proposals, implementation impact, and migration guidance.',
    url: '/spec-watch',
    content: 'specification releases proposals changelog protocol versions',
  },
  {
    title: 'MCP glossary',
    description:
      'Clear, version-aware definitions for Model Context Protocol terminology.',
    url: '/glossary',
    content: 'glossary definitions terminology protocol primitives transport',
  },
  {
    title: 'About All Things MCP',
    description:
      'Why ATM exists, what it publishes, and how its technical content is reviewed.',
    url: '/about',
    content:
      'about mission publication review independent developer field guide',
  },
  {
    title: 'Contribute',
    description:
      'Improve ATM content and code through public GitHub issues and pull requests.',
    url: '/contribute',
    content:
      'contribute edit write guide article GitHub pull request community',
  },
  {
    title: 'Independence and editorial policy',
    description:
      'How ATM preserves trust, attributes sources, and separates evidence from opinion.',
    url: '/independence',
    content: 'independence editorial policy corrections sponsorship disclosure',
  },
  {
    title: 'ATM newsletter',
    description:
      'Subscribe for new MCP guides, technical analysis, and specification updates.',
    url: '/#newsletter',
    content: 'newsletter subscribe email updates',
  },
].map((page) => ({
  id: page.url,
  title: page.title,
  description: page.description,
  breadcrumbs: ['All Things MCP'],
  tag: 'pages',
  structuredData: structure(page.description, page.content),
  url: page.url,
  category: 'pages' as const,
  kind: 'Page',
}));

const records = [...contentRecords, ...glossaryRecords, ...pageRecords];
const recordByUrl = new Map(records.map((record) => [record.url, record]));
const search = createSearchAPI('advanced', {
  language: 'english',
  indexes: records,
});

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get('query')?.trim();
  if (!query) return Response.json([]);

  const requestedCategory = requestUrl.searchParams.get('category');
  const category = searchCategories.find((item) => item === requestedCategory);
  const matches = await search.search(query, {
    tag: category,
    limit: 40,
  });
  const seen = new Set<string>();
  const results = [];

  for (const match of matches) {
    const baseUrl = match.url.split('#')[0];
    const record =
      recordByUrl.get(match.url) ??
      records.find((item) => item.url.split('#')[0] === baseUrl);
    if (!record || seen.has(record.url)) continue;
    seen.add(record.url);
    results.push({
      id: record.id,
      url: match.type === 'heading' ? match.url : record.url,
      title: record.title,
      description: record.description,
      snippet: match.type === 'page' ? record.description : match.content,
      breadcrumbs: record.breadcrumbs,
      category: record.category,
      kind: record.kind,
    });
    if (results.length === 12) break;
  }

  return Response.json(results);
}
