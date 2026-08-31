import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, RadioTower } from 'lucide-react';
import { ContentCard } from '@/components/content-card';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { Button } from '@/components/ui/button';

const paths = [
  {
    eyebrow: 'Guides',
    title: 'Build with MCP.',
    description:
      'Follow practical, step-by-step guidance from first concepts to production systems.',
    href: '/guides',
    label: 'Browse guides',
    icon: BookOpen,
  },
  {
    eyebrow: 'Blog',
    title: 'Understand the system.',
    description:
      'Read technical analysis, architecture explainers, and independent perspectives.',
    href: '/blog',
    label: 'Read the blog',
    icon: FileText,
  },
  {
    eyebrow: 'Spec Watch',
    title: 'Track the protocol.',
    description:
      'See specification releases translated into concrete developer impact.',
    href: '/spec-watch',
    label: 'Follow Spec Watch',
    icon: RadioTower,
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
          <h1>
            Learn, build,
            <br />
            and ship with <span>MCP.</span>
          </h1>
          <p>
            Practical guides, technical analysis, and specification updates for
            people building with the Model Context Protocol.
          </p>
          <div className="button-row">
            <Button href="/guides#learn">Start learning</Button>
            <Button href="/guides#build" variant="secondary">
              Explore the docs
            </Button>
          </div>
        </div>
        <div className="home-hero__visual">
          <Image
            className="home-hero__image"
            src="/images/mcp-ecosystem-hero.png"
            alt="MCP ecosystem diagram connecting hosts, clients, servers, tools, prompts, and resources around a secure protocol core."
            width={1448}
            height={1086}
            sizes="(max-width: 760px) calc(100vw - 56px), (max-width: 1100px) 50vw, 620px"
            priority
          />
        </div>
      </section>
      <section className="section-block">
        <div className="shell">
          <div className="path-intro">
            <p className="eyebrow">Three ways to use All Things MCP</p>
            <p>
              Follow practical guides, explore the ideas behind MCP, and stay
              current as the specification evolves.
            </p>
          </div>
          <div className="path-grid product-path-grid">
            {paths.map(({ icon: Icon, ...path }) => (
              <Link
                className="path-card product-path-card"
                href={path.href}
                key={path.title}
              >
                <span>
                  <Icon />
                </span>
                <small>{path.eyebrow}</small>
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
              <Link href="/guides">
                View all <ArrowRight />
              </Link>
            </div>
            <div className="stack-list">
              {[
                {
                  title: 'Build a minimal MCP server',
                  description:
                    'Create and inspect a focused server in small steps.',
                  icon: 'code',
                  meta: '4 steps · 55 min · Beginner',
                  href: '/guides/build-a-minimal-mcp-server',
                },
              ].map((item) => (
                <ContentCard key={item.title} item={item} />
              ))}
            </div>
          </div>
          <div>
            <div className="section-heading">
              <h2>Latest from the blog</h2>
              <Link href="/blog">
                View all <ArrowRight />
              </Link>
            </div>
            <div className="stack-list">
              {[
                {
                  title: 'What is MCP?',
                  description:
                    'A practical mental model for the protocol and where it fits.',
                  icon: 'book',
                  meta: 'Concepts · 10 min',
                  href: '/blog/what-is-mcp',
                },
                {
                  title: 'MCP architecture',
                  description:
                    'Hosts, clients, servers, sessions, and primitives in context.',
                  icon: 'network',
                  meta: 'Architecture · 18 min',
                  href: '/blog/mcp-architecture',
                },
                {
                  title: 'MCP in production',
                  description:
                    'What changes when identities, networks, and failures become real.',
                  icon: 'rocket',
                  meta: 'Production · 22 min',
                  href: '/blog/mcp-in-production',
                },
              ].map((item) => (
                <ContentCard key={item.title} item={item} />
              ))}
            </div>
          </div>
          <div>
            <div className="section-heading">
              <h2>Latest from Spec Watch</h2>
              <Link href="/spec-watch">
                View all <ArrowRight />
              </Link>
            </div>
            <Link
              className="spec-watch-feature"
              href="/library/spec-watch/current-protocol"
            >
              <div className="spec-watch-feature__meta">
                <span>Tracked revision</span>
                <b>Stable</b>
              </div>
              <h3>MCP Protocol Revision 2025-11-25</h3>
              <p>
                Review the changes that affect authorization, schemas,
                elicitation, metadata, and polling behavior.
              </p>
              <ul>
                <li>What changed</li>
                <li>Why it matters</li>
                <li>What implementers should review</li>
              </ul>
              <strong>
                Read the release analysis <ArrowRight />
              </strong>
            </Link>
          </div>
        </div>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
