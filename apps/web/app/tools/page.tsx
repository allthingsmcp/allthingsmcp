import { DirectoryHero } from '@/components/directory-hero';
import { ContentCard } from '@/components/content-card';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { toolFixtures } from '@/lib/site-data';

export default function ToolsPage() {
  return (
    <main id="main-content">
      <DirectoryHero
        eyebrow="Tools"
        title="Interactive tools for working with MCP"
        description="Explore architecture, authorization, transports, configuration, and tool quality. The first tools are being designed in public."
      >
        <div className="filter-pills" aria-label="Tool categories">
          {[
            'All',
            'Architecture',
            'Security',
            'Debugging',
            'Comparison',
            'Validation',
          ].map((item, index) => (
            <button className={index === 0 ? 'is-selected' : ''} key={item}>
              {item}
            </button>
          ))}
        </div>
      </DirectoryHero>
      <section className="section-block section-block--tight">
        <div className="shell">
          <div className="planned-banner">
            <div>
              <span>PLANNED</span>
              <h2>Tools will earn their way into the platform</h2>
              <p>
                Each tool will begin with a documented use case, transparent
                assumptions, and a useful non-interactive guide. We will not
                ship decorative demos.
              </p>
            </div>
          </div>
          <div className="card-grid card-grid--two tools-grid">
            {toolFixtures.map((item) => (
              <ContentCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
