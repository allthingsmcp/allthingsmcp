'use client';

import Link from 'next/link';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export type RangeChoice = { key: string; label: string; href: string };

/** Date range dropdown: presets as links plus a custom range form. */
export function RangeMenu({
  label,
  current,
  choices,
  custom,
}: {
  label: string;
  current: string;
  choices: RangeChoice[];
  custom: {
    from: string;
    to: string;
    hidden: Array<[string, string]>;
  };
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !root.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="analytics-range" ref={root}>
      <button
        type="button"
        className="analytics-range__button"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((value) => !value)}
      >
        <Calendar aria-hidden="true" size={16} />
        <span>{label}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </button>
      {open && (
        <div id={`${id}-menu`} className="analytics-range__menu">
          <ul>
            {choices.map((choice) => (
              <li key={choice.key}>
                <Link
                  href={choice.href}
                  aria-current={choice.key === current ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {choice.label}
                  {choice.key === current && (
                    <Check aria-hidden="true" size={16} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <form
            action="/admin/analytics"
            className="analytics-range__custom"
            onSubmit={() => setOpen(false)}
          >
            <p>Custom range (UTC)</p>
            <input type="hidden" name="range" value="custom" />
            {custom.hidden.map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <label>
              From
              <input
                type="date"
                name="from"
                defaultValue={custom.from}
                required
              />
            </label>
            <label>
              To
              <input type="date" name="to" defaultValue={custom.to} required />
            </label>
            <button type="submit" className="button button--primary">
              Apply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
