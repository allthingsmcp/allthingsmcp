import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentCard } from '@/components/content-card';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { ProtocolVisual } from '@/components/protocol-visual';
import { Button } from '@/components/ui/button';
import { hubs, type HubKey } from '@/lib/site-data';

export function HubPage({ hubKey }: { hubKey: HubKey }) {
  const hub = hubs[hubKey];
  return (
    <main id="main-content">
      <div className="shell">
        <Breadcrumbs items={[{ label: hub.eyebrow }]} />
      </div>
      <section className="shell hub-hero">
        <div className="hub-hero__copy">
          <p className="eyebrow">{hub.eyebrow}</p>
          <h1>{hub.title}</h1>
          <p>{hub.description}</p>
          <div className="button-row">
            <Button href={`#${hubKey}-start`}>{hub.primaryAction}</Button>
            <Button href={`#${hubKey}-guides`} variant="secondary">
              {hub.secondaryAction}
            </Button>
          </div>
        </div>
        <div className="hub-hero__visual">
          <ProtocolVisual type={hub.diagram} />
        </div>
      </section>
      <section className="section-block" id={`${hubKey}-start`}>
        <div className="shell">
          <div className="section-heading">
            <h2>{hub.sectionTitle}</h2>
            <a href={`#${hubKey}-guides`}>
              View all <ArrowRight />
            </a>
          </div>
          <div
            className={
              hub.cards.length > 6
                ? 'card-grid card-grid--four'
                : 'card-grid card-grid--three'
            }
          >
            {hub.cards.map((item) => (
              <ContentCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
      <section
        className="section-block section-block--subtle"
        id={`${hubKey}-guides`}
      >
        <div className="shell split-section">
          <div>
            <div className="section-heading">
              <h2>{hub.pathTitle}</h2>
              <Link href="/library">
                Browse library <ArrowRight />
              </Link>
            </div>
            <div className="stack-list">
              {hub.path.map((item, index) => (
                <ContentCard
                  key={item.title}
                  item={{ ...item, href: '/library' }}
                  index={hubKey === 'security' ? index : undefined}
                />
              ))}
            </div>
          </div>
          <aside className="checklist-panel">
            <p className="eyebrow">A practical standard</p>
            <h2>Know what good looks like</h2>
            <p>
              Each guide separates specification facts, implementation choices,
              and field-tested recommendations.
            </p>
            <ul>
              {[
                'Version-aware guidance',
                'Primary-source citations',
                'Implementation metadata',
                'Visible verification dates',
              ].map((item) => (
                <li key={item}>
                  <CheckCircle2 />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
