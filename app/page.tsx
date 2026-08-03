import Link from 'next/link';
import { ArrowRight, BookOpen, Code2, Rocket, ShieldCheck } from 'lucide-react';
import { ContentCard } from '@/components/content-card';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { ProtocolVisual } from '@/components/protocol-visual';
import { Button } from '@/components/ui/button';

const paths = [
  {
    title: "I'm new to MCP",
    description: 'Start with fundamentals and core concepts.',
    href: '/learn',
    label: 'Begin with MCP',
    icon: BookOpen,
    tone: 'blue',
  },
  {
    title: "I'm building with MCP",
    description: 'Learn to build servers, clients, and tools.',
    href: '/build',
    label: 'Build something',
    icon: Code2,
    tone: 'green',
  },
  {
    title: "I'm shipping to production",
    description: 'Deploy, scale, and operate MCP systems.',
    href: '/operate',
    label: 'Operate MCP',
    icon: Rocket,
    tone: 'violet',
  },
  {
    title: "I'm focused on security",
    description: 'Secure MCP systems with best practices.',
    href: '/security',
    label: 'Explore security',
    icon: ShieldCheck,
    tone: 'orange',
  },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <div className="announcement">
        <div className="shell">
          <span>New</span>
          <p>
            MCP specification coverage now tracks version and verification
            dates.
          </p>
          <Link href="/spec-watch">
            See what changed <ArrowRight />
          </Link>
        </div>
      </div>
      <section className="shell home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Independent · developer-first</p>
          <h1>
            Learn, build,
            <br />
            and ship with <span>MCP.</span>
          </h1>
          <p>
            Independent guides, tools, and architecture for the Model Context
            Protocol ecosystem.
          </p>
          <div className="button-row">
            <Button href="/learn">Start learning</Button>
            <Button href="/build" variant="secondary">
              Explore the docs
            </Button>
          </div>
        </div>
        <div className="home-hero__visual">
          <ProtocolVisual />
        </div>
      </section>
      <section className="section-block">
        <div className="shell">
          <div className="section-heading">
            <h2>Choose your path</h2>
          </div>
          <div className="path-grid">
            {paths.map(({ icon: Icon, ...path }) => (
              <Link
                className={`path-card path-card--${path.tone}`}
                href={path.href}
                key={path.title}
              >
                <span>
                  <Icon />
                </span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <b>
                  {path.label} <ArrowRight />
                </b>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section-block section-block--subtle">
        <div className="shell home-columns">
          <div>
            <div className="section-heading">
              <h2>Popular guides</h2>
              <Link href="/library">
                View all <ArrowRight />
              </Link>
            </div>
            <div className="stack-list">
              {[
                {
                  title: 'What is MCP?',
                  description:
                    'Understand the protocol through a practical mental model.',
                  icon: 'book',
                  meta: '10 min · Beginner',
                  href: '/library/guides/what-is-mcp',
                },
                {
                  title: 'MCP architecture',
                  description:
                    'Hosts, clients, servers, and primitives in context.',
                  icon: 'network',
                  meta: '18 min · Intermediate',
                  href: '/library/guides/mcp-architecture',
                },
                {
                  title: 'MCP authorization explained',
                  description:
                    'Roles, boundaries, grants, and protected resources.',
                  icon: 'shield',
                  meta: '18 min · Intermediate',
                  href: '/library/guides/mcp-authorization-explained',
                },
              ].map((item) => (
                <ContentCard key={item.title} item={item} />
              ))}
            </div>
          </div>
          <div>
            <div className="section-heading">
              <h2>Featured tools</h2>
              <Link href="/tools">
                View all <ArrowRight />
              </Link>
            </div>
            <div className="stack-list">
              {[
                {
                  title: 'Authorization Flow Explorer',
                  description:
                    'A planned interactive guide to authorization flows.',
                  icon: 'shield',
                  badge: 'Planned',
                },
                {
                  title: 'Architecture Visualizer',
                  description:
                    'A planned canvas for MCP topology and boundaries.',
                  icon: 'network',
                  badge: 'Planned',
                },
                {
                  title: 'Tool Description Linter',
                  description: 'A planned review surface for tool metadata.',
                  icon: 'check',
                  badge: 'Planned',
                },
              ].map((item) => (
                <ContentCard key={item.title} item={item} />
              ))}
            </div>
          </div>
          <aside className="ecosystem-snapshot">
            <p className="eyebrow">Ecosystem snapshot</p>
            <h2>Explore by project type</h2>
            {[
              'Servers',
              'Clients',
              'SDKs',
              'Gateways',
              'Registries',
              'Developer tools',
            ].map((item, index) => (
              <Link href="/ecosystem" key={item}>
                <span>{item}</span>
                <b>{[12, 8, 7, 4, 3, 9][index]}</b>
              </Link>
            ))}
          </aside>
        </div>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
