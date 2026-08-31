import type { MDXComponents } from 'mdx/types';
import { ArrowRight, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { MdxTabs, type MdxTabItem } from '@/components/mdx-tabs';

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
export function Steps({
  items,
}: {
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <ol className="mdx-steps">
      {items.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.description}</span>
        </li>
      ))}
    </ol>
  );
}
export function Tabs({ items }: { items: MdxTabItem[] }) {
  return <MdxTabs items={items} />;
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
export function CardGrid({
  items,
}: {
  items: Array<{ title: string; description: string; href?: string }>;
}) {
  return (
    <div className="mdx-card-grid">
      {items.map((item) => {
        const content = (
          <>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
            {item.href && <ArrowRight aria-hidden="true" />}
          </>
        );

        return item.href ? (
          <a href={item.href} key={item.title}>
            {content}
          </a>
        ) : (
          <article key={item.title}>{content}</article>
        );
      })}
    </div>
  );
}
export function MetadataPanel({ children }: { children: React.ReactNode }) {
  return <aside className="mdx-metadata-panel">{children}</aside>;
}
export function ProtocolDiagram({
  children,
  label,
  nodes,
}: {
  children?: React.ReactNode;
  label: string;
  nodes?: string[];
}) {
  return (
    <figure className="mdx-diagram">
      <div className="mdx-diagram__canvas" role="img" aria-label={label}>
        {nodes?.map((node, index) => (
          <div className="mdx-diagram__segment" key={node}>
            <span>{node}</span>
            {index < nodes.length - 1 && <ArrowRight aria-hidden="true" />}
          </div>
        ))}
        {!nodes && children}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
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
