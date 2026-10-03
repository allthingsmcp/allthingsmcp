import { Breadcrumbs } from '@/components/breadcrumbs';
import { NewsletterPanel } from '@/components/newsletter-panel';

export function InfoPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content">
      <div className="shell">
        <Breadcrumbs items={[{ label: title }]} />
      </div>
      <article className="shell info-page">
        <header>
          <p className="eyebrow">All Things MCP</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className="info-prose">{children}</div>
      </article>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
