import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import type { CardItem } from '@/lib/site-data';

export function ContentCard({
  item,
  index,
}: {
  item: CardItem;
  index?: number;
}) {
  const body = (
    <>
      <div className="card-icon">
        <Icon name={item.icon} />
      </div>
      <div className="card-copy">
        <div className="card-title-row">
          <h3>{item.title}</h3>
          {item.badge && <span className="badge">{item.badge}</span>}
        </div>
        <p>{item.description}</p>
        {item.meta && <span className="card-meta">{item.meta}</span>}
      </div>
      {item.href && <ArrowRight aria-hidden="true" className="card-arrow" />}
      {index !== undefined && (
        <span className="step-number" aria-hidden="true">
          {index + 1}
        </span>
      )}
    </>
  );
  return item.href ? (
    <Link className="content-card" href={item.href}>
      {body}
    </Link>
  ) : (
    <article className="content-card">{body}</article>
  );
}
