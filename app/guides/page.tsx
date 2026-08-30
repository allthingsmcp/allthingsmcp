import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Hammer,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import {
  GuideDirectory,
  type GuideSummary,
} from '@/components/guide-directory';
import { NewsletterPanel } from '@/components/newsletter-panel';
import type { GuideFrontmatter } from '@/lib/content-schema';
import { canonicalContentUrl, pagesByType } from '@/lib/content';

const paths = [
  {
    title: 'Learn',
    text: 'Understand MCP fundamentals, architecture, and core concepts.',
    href: '#learn',
    icon: BookOpen,
  },
  {
    title: 'Build',
    text: 'Build servers, clients, tools, resources, and integrations.',
    href: '#build',
    icon: Hammer,
  },
  {
    title: 'Operate',
    text: 'Deploy, monitor, scale, and run MCP systems in production.',
    href: '#operate',
    icon: ServerCog,
  },
  {
    title: 'Security',
    text: 'Authorization, identity, permissions, and secure deployment.',
    href: '#security',
    icon: ShieldCheck,
  },
];

export default function GuidesPage() {
  const guides: GuideSummary[] = pagesByType('guide').map((page) => {
    const data = page.data as GuideFrontmatter;
    return {
      title: data.title,
      description: data.description,
      outcome: data.outcome,
      category: data.guideCategory,
      difficulty: data.difficulty ?? 'beginner',
      estimatedMinutes: data.estimatedMinutes ?? 0,
      stepCount: data.steps.length,
      href: canonicalContentUrl(page),
    };
  });

  return (
    <main id="main-content" className="guides-page">
      <section className="shell publication-hero">
        <p className="eyebrow">Learn by doing</p>
        <h1>MCP Guides</h1>
        <p>
          Practical guides to help you understand MCP, build capable systems,
          operate in production, and secure your implementations.
        </p>
      </section>
      <section className="shell guide-paths" aria-labelledby="paths-title">
        <div className="editorial-heading">
          <p className="eyebrow">Choose your path</p>
          <h2 id="paths-title">Move from understanding to production.</h2>
        </div>
        <div>
          {paths.map(({ icon: Icon, ...path }) => (
            <Link href={path.href} key={path.title}>
              <Icon />
              <h3>{path.title}</h3>
              <p>{path.text}</p>
              <ArrowRight />
            </Link>
          ))}
        </div>
      </section>
      <section
        className="shell guide-library"
        aria-labelledby="guide-library-title"
      >
        <div className="editorial-heading">
          <p className="eyebrow">Guide library</p>
          <h2 id="guide-library-title">Choose an outcome.</h2>
        </div>
        <GuideDirectory guides={guides} />
      </section>
      <section className="shell guide-sequence">
        <div>
          <p className="eyebrow">Recommended sequence</p>
          <h2>
            New to MCP? Start with the system, then build one small server.
          </h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <Link href="/guides/mcp-fundamentals">MCP Fundamentals</Link>
          </li>
          <li>
            <span>02</span>
            <Link href="/guides/build-a-minimal-mcp-server">
              Build a Minimal MCP Server
            </Link>
          </li>
        </ol>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
