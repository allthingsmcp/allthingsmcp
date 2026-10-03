'use client';

import { useId, useState } from 'react';

export type MdxTabItem = {
  label: string;
  content: string;
  language?: string;
};

export function MdxTabs({ items }: { items: MdxTabItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const id = useId();
  const activeItem = items[activeIndex];

  if (!activeItem) return null;

  return (
    <div className="mdx-tabs">
      <div className="mdx-tabs__list" role="tablist" aria-label="Examples">
        {items.map((item, index) => (
          <button
            aria-controls={`${id}-panel-${index}`}
            aria-selected={activeIndex === index}
            className={activeIndex === index ? 'is-active' : undefined}
            id={`${id}-tab-${index}`}
            key={item.label}
            onClick={() => setActiveIndex(index)}
            role="tab"
            tabIndex={activeIndex === index ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`${id}-tab-${activeIndex}`}
        className="mdx-tabs__panel"
        id={`${id}-panel-${activeIndex}`}
        role="tabpanel"
      >
        <pre>
          <code data-language={activeItem.language}>{activeItem.content}</code>
        </pre>
      </div>
    </div>
  );
}
