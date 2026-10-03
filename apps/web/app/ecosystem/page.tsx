import Link from 'next/link';
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { DirectoryHero } from '@/components/directory-hero';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { StatusBadge } from '@/components/status-badge';

const projects = [
  {
    name: 'Filesystem MCP Server',
    kind: 'Server',
    description: 'Secure file operations with configurable access control.',
    tech: 'TypeScript',
    icon: 'FS',
  },
  {
    name: 'PostgreSQL MCP Server',
    kind: 'Server',
    description: 'Read-only access to PostgreSQL databases and schemas.',
    tech: 'Python',
    icon: 'PG',
  },
  {
    name: 'Reference TypeScript SDK',
    kind: 'SDK',
    description: 'Build MCP clients and servers with typed primitives.',
    tech: 'TypeScript',
    icon: 'TS',
  },
  {
    name: 'Gateway reference',
    kind: 'Gateway',
    description: 'A reference routing and policy boundary for MCP systems.',
    tech: 'Go',
    icon: 'GW',
  },
];

export default function EcosystemPage() {
  return (
    <main id="main-content">
      <DirectoryHero
        eyebrow="Ecosystem"
        title="Explore the MCP ecosystem"
        description="Discover servers, clients, SDKs, gateways, registries, and developer tools across the Model Context Protocol ecosystem."
      >
        <label className="directory-search">
          <Search />
          <span className="sr-only">Search the ecosystem</span>
          <input placeholder="Search the ecosystem" />
          <kbd>⌘K</kbd>
        </label>
        <div className="filter-pills" aria-label="Project categories">
          {[
            'All',
            'Servers',
            'Clients',
            'SDKs',
            'Gateways',
            'Registries',
            'Developer tools',
          ].map((item, index) => (
            <button className={index === 0 ? 'is-selected' : ''} key={item}>
              {item}
            </button>
          ))}
        </div>
      </DirectoryHero>
      <section className="section-block section-block--tight">
        <div className="shell directory-layout">
          <aside className="filter-sidebar">
            <div className="filter-sidebar__title">
              <b>Filters</b>
              <button>Clear all</button>
            </div>
            {[
              'Language',
              'Transport',
              'Authentication',
              'Runtime',
              'License',
              'Maintainer',
              'Spec compatibility',
            ].map((group, index) => (
              <details key={group} open={index < 2}>
                <summary>{group}</summary>
                {index < 2 && (
                  <div>
                    {['TypeScript', 'Python', 'Go', 'Rust'].map((item) => (
                      <label key={item}>
                        <input type="checkbox" />
                        {item}
                      </label>
                    ))}
                  </div>
                )}
              </details>
            ))}
          </aside>
          <div className="directory-main">
            <div className="mobile-filter">
              <button>
                <SlidersHorizontal /> Filters
              </button>
            </div>
            <div className="section-heading">
              <h2>Featured projects</h2>
              <Link href="#recent">
                View all <ArrowRight />
              </Link>
            </div>
            <div className="project-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.name}>
                  <span className="project-logo">{project.icon}</span>
                  <div>
                    <p className="project-kind">{project.kind}</p>
                    <h3>{project.name}</h3>
                    <StatusBadge tone="neutral">Not yet reviewed</StatusBadge>
                    <p>{project.description}</p>
                    <span className="tech-tag">{project.tech}</span>
                  </div>
                </article>
              ))}
            </div>
            <div
              id="recent"
              className="section-heading section-heading--spaced"
            >
              <h2>Recently updated</h2>
              <Link href="/contribute">
                Submit a project <ArrowRight />
              </Link>
            </div>
            <div className="data-list">
              {projects.map((project, index) => (
                <div key={project.name}>
                  <span className="project-logo project-logo--small">
                    {project.icon}
                  </span>
                  <b>{project.name}</b>
                  <span>{project.kind}</span>
                  <span>
                    {index + 1} day{index ? 's' : ''} ago
                  </span>
                  <StatusBadge tone="neutral">Not reviewed</StatusBadge>
                </div>
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
