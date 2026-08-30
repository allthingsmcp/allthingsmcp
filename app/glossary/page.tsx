import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { DirectoryHero } from '@/components/directory-hero';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { StatusBadge } from '@/components/status-badge';

const terms = [
  [
    'Authorization',
    'The process of determining what actions a client or user is allowed to perform.',
    'Security',
  ],
  [
    'Capability',
    'A feature or function that an MCP participant can support or negotiate.',
    'Protocol',
  ],
  [
    'Client',
    'A protocol participant inside a host that connects to one MCP server.',
    'Protocol',
  ],
  [
    'Elicitation',
    'A server-initiated request for additional information from a user through a client.',
    'Primitives',
  ],
  [
    'Host',
    'The application environment that coordinates one or more MCP clients.',
    'Protocol',
  ],
  [
    'Resource',
    'Contextual data that a server exposes for clients to read.',
    'Primitives',
  ],
  [
    'Tool',
    'An operation exposed by a server that a model can invoke through a client.',
    'Primitives',
  ],
  [
    'Transport',
    'The communication mechanism that carries MCP messages.',
    'Transport',
  ],
];

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
                <b>{[terms.length, 3, 3, 1, 1, 0, 0][index]}</b>
              </button>
            ))}
          </aside>
          <div className="glossary-list">
            {terms.map(([term, definition, category]) => (
              <article key={term}>
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
                {term === 'Client' && (
                  <Link
                    href="/glossary/client"
                    aria-label="Read the Client definition"
                  >
                    <ArrowRight />
                  </Link>
                )}
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
