import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { DirectoryHero } from '@/components/directory-hero';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';

export default function SpecWatchPage() {
  return (
    <main id="main-content">
      <DirectoryHero
        eyebrow="Spec Watch"
        title="Track what changes in MCP"
        description="Independent analysis of specification releases, proposals, implementation impact, and migration guidance—so you can build with confidence."
      >
        <div className="button-row">
          <Button href="#latest">View latest release</Button>
          <Button href="#proposals" variant="secondary">
            Explore proposals
          </Button>
        </div>
      </DirectoryHero>
      <div
        className="shell release-timeline"
        role="img"
        aria-label="Specification lifecycle from stable release through draft and proposed work"
      >
        {[
          ['2025-03-26', 'Stable', 'green'],
          ['2025-06-18', 'Stable', 'blue'],
          ['Next draft', 'Draft', 'orange'],
          ['Future', 'Proposed', 'violet'],
        ].map(([date, status, tone], index) => (
          <div key={date}>
            <span
              className={
                index < 2 ? 'timeline-dot timeline-dot--solid' : 'timeline-dot'
              }
            />
            <b>{date}</b>
            <StatusBadge tone={tone as 'green' | 'blue' | 'orange' | 'violet'}>
              {status}
            </StatusBadge>
          </div>
        ))}
      </div>
      <section className="section-block" id="latest">
        <div className="shell spec-grid">
          <article className="release-card">
            <div>
              <p className="eyebrow">Reference fixture</p>
              <StatusBadge tone="green">Stable</StatusBadge>
            </div>
            <h2>MCP specification release</h2>
            <p>
              This representative entry demonstrates the release template.
              Official dates and version-specific analysis will be published
              only after technical review.
            </p>
            <a
              href="https://modelcontextprotocol.io/specification/"
              target="_blank"
              rel="noreferrer"
            >
              View official specification <ArrowRight />
            </a>
            <hr />
            <div className="release-columns">
              <div>
                <h3>What changed</h3>
                <ul>
                  <li>Protocol changes summarized with primary sources</li>
                  <li>
                    Behavioral changes separated from editorial clarifications
                  </li>
                  <li>Compatibility notes recorded by implementation area</li>
                </ul>
              </div>
              <div>
                <h3>Why it matters</h3>
                <p>
                  Release notes focus on concrete effects for client developers,
                  server developers, and operators.
                </p>
              </div>
            </div>
          </article>
          <div id="proposals">
            <div className="section-heading">
              <h2>Active proposals</h2>
              <Link href="/contribute">
                Suggest coverage <ArrowRight />
              </Link>
            </div>
            <div className="proposal-list">
              {[
                'Structured content',
                'Capability discovery',
                'Authorization profiles',
              ].map((title, index) => (
                <article key={title}>
                  <FileText />
                  <div>
                    <h3>{title}</h3>
                    <p>
                      Tracking fixture for proposal analysis and implementation
                      impact.
                    </p>
                    <span>Affected areas: clients, servers, capabilities</span>
                  </div>
                  <StatusBadge tone={index === 1 ? 'orange' : 'violet'}>
                    {index === 1 ? 'Draft' : 'Proposed'}
                  </StatusBadge>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
