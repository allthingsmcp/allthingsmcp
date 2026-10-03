import { Search } from 'lucide-react';
import { DirectoryHero } from '@/components/directory-hero';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { StatusBadge } from '@/components/status-badge';
import { glossaryTerms } from '@/lib/glossary-data';

export default function GlossaryPage() {
  return (
    <main id="main-content">
      <DirectoryHero
        eyebrow="Glossary"
        title="MCP glossary"
        description="Clear, version-aware definitions for the language of Model Context Protocol."
      >
        <label className="directory-search">
          <Search />
          <span className="sr-only">Search terms</span>
          <input placeholder="Search terms" />
        </label>
        <div className="filter-pills">
          {[
            'All',
            'Protocol',
            'Primitives',
            'Transport',
            'Security',
            'Lifecycle',
            'Ecosystem',
          ].map((item, index) => (
            <button className={index === 0 ? 'is-selected' : ''} key={item}>
              {item}
            </button>
          ))}
        </div>
      </DirectoryHero>
      <section className="section-block section-block--tight">
        <div className="shell glossary-layout">
          <aside>
            <h2>Filter by category</h2>
            {[
              'All terms',
              'Protocol',
              'Primitives',
              'Transport',
              'Security',
              'Lifecycle',
              'Ecosystem',
            ].map((item, index) => (
              <button key={item}>
                <span>{item}</span>
                <b>{[glossaryTerms.length, 3, 3, 1, 1, 0, 0][index]}</b>
              </button>
            ))}
          </aside>
          <div className="glossary-list">
            {glossaryTerms.map(({ term, definition, category }) => (
              <article id={term.toLowerCase()} key={term}>
                <span className="term-letter">{term.charAt(0)}</span>
                <h2>{term}</h2>
                <p>{definition}</p>
                <StatusBadge
                  tone={
                    category === 'Security'
                      ? 'green'
                      : category === 'Transport'
                        ? 'blue'
                        : 'violet'
                  }
                >
                  {category}
                </StatusBadge>
              </article>
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
