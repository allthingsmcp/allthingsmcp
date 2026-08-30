import Link from 'next/link';
import { ArrowRight, Radio } from 'lucide-react';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { StatusBadge } from '@/components/status-badge';
import type { SpecWatchFrontmatter } from '@/lib/content-schema';
import { canonicalContentUrl, pagesByType } from '@/lib/content';

export default function SpecWatchPage() {
  const entries = pagesByType('spec-release', 'spec-proposal');
  const latest = entries[0];
  const data = latest?.data as SpecWatchFrontmatter | undefined;
  return (
    <main id="main-content" className="spec-page">
      <section className="shell publication-hero">
        <p className="eyebrow">Spec Watch</p>
        <h1>What changed in MCP—and why it matters.</h1>
        <p>
          Independent analysis of releases, proposals, migration work, and
          implementation impact.
        </p>
      </section>
      <section className="shell spec-current">
        <div className="spec-current__marker">
          <Radio />
          <span>Current stable revision</span>
          <strong>2026-07-28</strong>
        </div>
        {latest && data && (
          <article>
            <div>
              <p className="eyebrow">Latest analysis</p>
              <StatusBadge tone="green">{data.releaseStatus}</StatusBadge>
            </div>
            <h2>{data.title}</h2>
            <p>{data.description}</p>
            <div className="spec-impact-preview">
              <div>
                <span>Client</span>
                <p>{data.clientImpact[0]}</p>
              </div>
              <div>
                <span>Server</span>
                <p>{data.serverImpact[0]}</p>
              </div>
              <div>
                <span>Production</span>
                <p>{data.productionImpact[0]}</p>
              </div>
            </div>
            <Link href={canonicalContentUrl(latest)}>
              Read the impact analysis <ArrowRight />
            </Link>
          </article>
        )}
      </section>
      <section className="shell spec-method">
        <p className="eyebrow">How we analyze a release</p>
        <h2>Changes become useful when their consequences are clear.</h2>
        <ol>
          <li>
            <span>01</span>
            <strong>What changed</strong>
            <p>The normative behavior and its primary sources.</p>
          </li>
          <li>
            <span>02</span>
            <strong>Who is affected</strong>
            <p>Client, server, gateway, and operator responsibilities.</p>
          </li>
          <li>
            <span>03</span>
            <strong>What to do</strong>
            <p>Concrete migration and compatibility checks.</p>
          </li>
        </ol>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
