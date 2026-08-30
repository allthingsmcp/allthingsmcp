import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  FileText,
  Hammer,
  Radio,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import {
  KnowledgeBridgeVisual,
  ProductionArchitectureVisual,
} from '@/components/architecture-visuals';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { ProtocolVisual } from '@/components/protocol-visual';
import { Button } from '@/components/ui/button';

const journey = [
  {
    title: 'Understand',
    description: 'Core concepts, architecture, and durable mental models.',
    href: '/guides#learn',
    icon: BookOpen,
  },
  {
    title: 'Build',
    description: 'Servers, clients, tools, resources, and integrations.',
    href: '/guides#build',
    icon: Hammer,
  },
  {
    title: 'Operate',
    description: 'Deployment, gateways, observability, and reliability.',
    href: '/guides#operate',
    icon: ServerCog,
  },
  {
    title: 'Secure',
    description: 'Authorization, identity, permissions, and threat modelling.',
    href: '/guides#security',
    icon: ShieldCheck,
  },
];

const startingPoints = [
  {
    eyebrow: 'Guide · Learn',
    title: 'MCP Fundamentals',
    href: '/guides/mcp-fundamentals',
  },
  {
    eyebrow: 'Guide · Build',
    title: 'Build a Minimal MCP Server',
    href: '/guides/build-a-minimal-mcp-server',
  },
  {
    eyebrow: 'Blog · Architecture',
    title: 'MCP Architecture',
    href: '/blog/mcp-architecture',
  },
  {
    eyebrow: 'Spec Watch',
    title: 'MCP Protocol Revision 2026-07-28',
    href: '/spec-watch/current-protocol',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="focused-home">
      <section className="shell focused-hero">
        <div className="focused-hero__copy">
          <p className="eyebrow">Independent · developer-first</p>
          <h1>
            MCP, explained
            <span>from first principles</span>
            to production.
          </h1>
          <p>
            All Things MCP turns the Model Context Protocol specification into
            practical knowledge developers can use—from fundamentals and
            architecture to production and security.
          </p>
          <div className="button-row">
            <Button href="/guides/mcp-fundamentals">Start with MCP</Button>
            <Button href="/guides" variant="secondary">
              Explore Guides
            </Button>
          </div>
        </div>
        <div className="focused-hero__visual">
          <ProtocolVisual />
        </div>
      </section>

      <section className="editorial-section why-section">
        <div className="shell why-layout">
          <div>
            <p className="eyebrow">Why All Things MCP exists</p>
            <h2>
              The specification tells you what MCP is.
              <span>
                Building real systems requires understanding how it fits
                together.
              </span>
            </h2>
            <p>
              Production introduces authorization, gateways, deployment,
              observability, evolving versions, and real trust decisions. We
              bridge the gap between specification language and working systems.
            </p>
          </div>
          <KnowledgeBridgeVisual />
        </div>
      </section>

      <section className="editorial-section journey-section">
        <div className="shell">
          <div className="editorial-heading">
            <p className="eyebrow">The MCP journey</p>
            <h2>Wherever you are with MCP, we’ll help you move forward.</h2>
          </div>
          <div className="journey-rail">
            {journey.map(({ icon: Icon, ...item }, index) => (
              <div className="journey-item" key={item.title}>
                <Link href={item.href}>
                  <span className="journey-number">0{index + 1}</span>
                  <Icon />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <b>
                    Explore this path <ArrowRight />
                  </b>
                </Link>
                {index < journey.length - 1 && (
                  <ArrowDown className="journey-arrow" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-section architecture-section">
        <div className="shell">
          <div className="architecture-intro">
            <p className="eyebrow">Beyond the demo</p>
            <h2>Understand the full MCP system.</h2>
            <p>
              The protocol is only one layer. See how clients, gateways,
              servers, authorization, observability, and data services shape
              production behavior.
            </p>
          </div>
          <ProductionArchitectureVisual />
        </div>
      </section>

      <section className="editorial-section product-section">
        <div className="shell">
          <div className="editorial-heading">
            <p className="eyebrow">Three ways to use All Things MCP</p>
            <h2>Do the work. Understand the context. Track the protocol.</h2>
          </div>
          <div className="product-showcases">
            <Link
              href="/guides"
              className="product-showcase product-showcase--guides"
            >
              <BookOpen />
              <span>Guides</span>
              <h3>Learn by doing.</h3>
              <p>
                Outcome-driven, step-by-step paths from fundamentals to secure
                production systems.
              </p>
              <b>
                Browse Guides <ArrowRight />
              </b>
            </Link>
            <Link
              href="/blog"
              className="product-showcase product-showcase--blog"
            >
              <FileText />
              <span>Blog</span>
              <h3>Understand the bigger picture.</h3>
              <p>
                Technical analysis, architecture explainers, and independent
                perspective.
              </p>
              <b>
                Read the Blog <ArrowRight />
              </b>
            </Link>
            <Link
              href="/spec-watch"
              className="product-showcase product-showcase--spec"
            >
              <Radio />
              <span>Spec Watch</span>
              <h3>Know what changed—and why.</h3>
              <p>
                Specification releases translated into concrete developer
                impact.
              </p>
              <b>
                Follow Spec Watch <ArrowRight />
              </b>
            </Link>
          </div>
        </div>
      </section>

      <section className="editorial-section starting-section">
        <div className="shell">
          <div className="editorial-heading">
            <p className="eyebrow">Curated starting points</p>
            <h2>Start exploring.</h2>
          </div>
          <div className="starting-list">
            {startingPoints.map((item, index) => (
              <Link href={item.href} key={item.title}>
                <span>0{index + 1}</span>
                <div>
                  <small>{item.eyebrow}</small>
                  <h3>{item.title}</h3>
                </div>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter-close">
        <div className="shell">
          <NewsletterPanel dark />
        </div>
      </section>
    </main>
  );
}
