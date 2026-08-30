import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { getMDXComponents } from '@/components/mdx';
import { StatusBadge } from '@/components/status-badge';
import type { SpecWatchFrontmatter } from '@/lib/content-schema';
import { pageByTypeAndSlug, pagesByType } from '@/lib/content';

export function generateStaticParams() {
  return pagesByType('spec-release', 'spec-proposal').map((page) => ({
    slug: page.slugs.at(-1),
  }));
}

function ImpactList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function SpecWatchEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pageByTypeAndSlug(['spec-release', 'spec-proposal'], slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & SpecWatchFrontmatter;
  const MDX = page.data.body;
  return (
    <main id="main-content" className="spec-detail">
      <div className="shell">
        <Breadcrumbs
          items={[
            { label: 'Spec Watch', href: '/spec-watch' },
            { label: data.title },
          ]}
        />
      </div>
      <article className="shell">
        <header>
          <div>
            <p className="eyebrow">Release analysis · {data.releaseDate}</p>
            <StatusBadge
              tone={data.releaseStatus === 'stable' ? 'green' : 'orange'}
            >
              {data.releaseStatus}
            </StatusBadge>
          </div>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
          <a href={data.officialSource}>
            Read the official specification <ExternalLink />
          </a>
        </header>
        <div className="spec-detail__body">
          <div className="prose">
            <MDX components={getMDXComponents()} />
          </div>
          <aside>
            <ImpactList title="What changed" items={data.changes} />
            <ImpactList title="Client impact" items={data.clientImpact} />
            <ImpactList title="Server impact" items={data.serverImpact} />
            <ImpactList
              title="Production impact"
              items={data.productionImpact}
            />
            <ImpactList title="What to do" items={data.recommendedActions} />
            <section>
              <h2>Primary sources</h2>
              {data.references.map((reference) => (
                <a href={reference.url} key={reference.url}>
                  {reference.label} <ExternalLink />
                </a>
              ))}
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
