import Link from 'next/link';
import { Rss } from 'lucide-react';
import { Logo } from '@/components/logo';
import { SearchDialogTrigger } from '@/components/search-dialog';
import { siteConfig } from '@/lib/config';

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

const groups = [
  {
    title: 'Explore',
    links: [
      ['Guides', '/guides'],
      ['Blog', '/blog'],
      ['Spec Watch', '/spec-watch'],
    ],
  },
  {
    title: 'Stay current',
    links: [
      ['Newsletter', '/#newsletter'],
      ['Search', '/search'],
    ],
  },
  {
    title: 'Project',
    links: [
      ['About', '/about'],
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
                {group.links.map(([label, href]) =>
                  label === 'Search' ? (
                    <SearchDialogTrigger key={label}>
                      Search
                    </SearchDialogTrigger>
                  ) : (
                    <Link key={label} href={href}>
                      {label}
                    </Link>
                  ),
                )}
              </div>
            </section>
            <details className="footer-group footer-group--mobile">
              <summary>{group.title}</summary>
              <div>
                {group.links.map(([label, href]) =>
                  label === 'Search' ? (
                    <SearchDialogTrigger key={label}>
                      Search
                    </SearchDialogTrigger>
                  ) : (
                    <Link key={label} href={href}>
                      {label}
                    </Link>
                  ),
                )}
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
            <GitHubMark />
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
