import { Breadcrumbs } from '@/components/breadcrumbs';

export function DirectoryHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="shell">
        <Breadcrumbs items={[{ label: eyebrow }]} />
      </div>
      <section className="shell directory-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </>
  );
}
