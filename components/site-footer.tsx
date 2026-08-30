import Link from 'next/link';
import { GitFork, Rss } from 'lucide-react';
import { Logo } from '@/components/logo';
import { siteConfig } from '@/lib/config';

const groups = [
  {
    title: 'Explore',
    links: [
      ['Guides', '/guides'],
      ['Blog', '/blog'],
      ['Spec Watch', '/spec-watch'],
      ['Glossary', '/glossary'],
    ],
  },
  {
    title: 'Guide paths',
    links: [
      ['Learn MCP', '/guides#learn'],
      ['Build with MCP', '/guides#build'],
      ['Operate MCP', '/guides#operate'],
      ['Secure MCP', '/guides#security'],
    ],
  },
  {
    title: 'Project',
    links: [
      ['About', '/about'],
      ['Independence', '/independence'],
      ['Editorial policy', '/editorial-policy'],
      ['Contribute', '/contribute'],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell focused-footer-grid">
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
        <div className="footer-manifesto">
          <Logo inverse />
          <p>Independent guides, analysis, and practical knowledge for MCP.</p>
        </div>
      </div>
      <div className="shell footer-bottom">
        <p>© 2026 All Things MCP</p>
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
        <p>Independent. Developer-first. MCP focused.</p>
      </div>
    </footer>
  );
}
