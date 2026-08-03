import type { MDXComponents } from 'mdx/types';
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: 'note' | 'warning';
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className={`mdx-callout mdx-callout--${type}`}>
      {type === 'warning' ? <TriangleAlert /> : <Info />}
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </aside>
  );
}
export function Steps({ children }: { children: React.ReactNode }) {
  return <div className="mdx-steps">{children}</div>;
}
export function Tabs({ children }: { children: React.ReactNode }) {
  return <div className="mdx-tabs">{children}</div>;
}
export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mdx-checklist">
      {items.map((item) => (
        <li key={item}>
          <CheckCircle2 />
          {item}
        </li>
      ))}
    </ul>
  );
}
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="mdx-card-grid">{children}</div>;
}
export function MetadataPanel({ children }: { children: React.ReactNode }) {
  return <aside className="mdx-metadata-panel">{children}</aside>;
}
export function ProtocolDiagram({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <figure className="mdx-diagram">
      <div role="img" aria-label={label}>
        {children}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    Callout,
    Steps,
    Tabs,
    Checklist,
    CardGrid,
    MetadataPanel,
    ProtocolDiagram,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
