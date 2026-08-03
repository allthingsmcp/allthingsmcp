import Link from 'next/link';
import { GitFork, Rss } from 'lucide-react';
import { Logo } from '@/components/logo';
import { siteConfig } from '@/lib/config';

const groups = [
  {
    title: 'Learn',
    links: [
      ['Overview', '/learn'],
      ['Learning paths', '/learn#paths'],
      ['Core concepts', '/learn#concepts'],
      ['Glossary', '/glossary'],
    ],
  },
  {
    title: 'Build',
    links: [
      ['Servers', '/build'],
      ['Clients', '/build'],
      ['Tools and resources', '/build'],
      ['Tutorials', '/library/tutorials'],
    ],
  },
  {
    title: 'Operate',
    links: [
      ['Deployment', '/operate'],
      ['Gateways', '/operate'],
      ['Registries', '/ecosystem'],
      ['Observability', '/operate'],
    ],
  },
  {
    title: 'Security',
    links: [
      ['Authorization', '/security'],
      ['Identity', '/security'],
      ['Threat modelling', '/security'],
      ['Best practices', '/security'],
    ],
  },
  {
    title: 'Ecosystem',
    links: [
      ['Servers', '/ecosystem'],
      ['Clients', '/ecosystem'],
      ['SDKs', '/ecosystem'],
      ['Developer tools', '/tools'],
    ],
  },
  {
    title: 'Project',
    links: [
      ['About', '/about'],
      ['Newsletter', '#newsletter'],
      ['Contribute', '/contribute'],
      ['Independence', '/independence'],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        {groups.map((group) => (
          <div className="footer-group-pair" key={group.title}>
            <section className="footer-group footer-group--desktop">
              <h2>{group.title}</h2>
              <div>
                {group.links.map(([label, href]) => (
                  <Link key={label} href={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </section>
            <details className="footer-group footer-group--mobile">
              <summary>{group.title}</summary>
              <div>
                {group.links.map(([label, href]) => (
                  <Link key={label} href={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
      <div className="shell footer-bottom">
        <div>
          <Logo inverse />
          <p>Independent. Developer-first. MCP focused.</p>
        </div>
        <div className="footer-social">
          <Link
            href={siteConfig.githubRepo}
            aria-label="All Things MCP on GitHub"
          >
            <GitFork />
          </Link>
          <Link
            href={siteConfig.substackUrl}
            aria-label="All Things MCP newsletter"
          >
            <Rss />
          </Link>
        </div>
        <p>© 2026 All Things MCP</p>
      </div>
    </footer>
  );
}
