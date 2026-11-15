'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

export type PanelRow = {
  key: string;
  label: string;
  /** Emoji or short text shown before the label, such as a flag. */
  icon?: string;
  /** Applies this row as a dashboard filter. */
  href?: string;
  /** Drives the bar length. */
  value: number;
  display: string;
  /** Optional second column, such as an event total. */
  secondary?: string;
};

export type PanelTab = {
  id: string;
  label: string;
  column: string;
  secondaryColumn?: string;
  rows: PanelRow[];
};

const collapsedRows = 8;

/** A card with tabs, each showing a ranked list with proportional bars. */
export function TabbedPanel({
  tabs,
  emptyText = 'No data for this period.',
}: {
  tabs: PanelTab[];
  emptyText?: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState(tabs[0]!.id);
  const [expanded, setExpanded] = useState(false);
  const tab = tabs.find((item) => item.id === selected) ?? tabs[0]!;
  const top = Math.max(1, ...tab.rows.map((row) => row.value));
  const rows = expanded ? tab.rows : tab.rows.slice(0, collapsedRows);

  return (
    <section className="analytics-panel">
      <header className="analytics-panel__head">
        <div role="tablist" className="analytics-panel__tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${id}-${item.id}`}
              aria-selected={item.id === tab.id}
              aria-controls={`${id}-list`}
              onClick={() => {
                setSelected(item.id);
                setExpanded(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="analytics-panel__columns" aria-hidden="true">
          <span>{tab.column}</span>
          {tab.secondaryColumn && <span>{tab.secondaryColumn}</span>}
        </span>
      </header>
      <div
        id={`${id}-list`}
        role="tabpanel"
        aria-labelledby={`${id}-${tab.id}`}
        className="analytics-panel__body"
      >
        {rows.length ? (
          <ol className="analytics-rows">
            {rows.map((row) => {
              const content = (
                <>
                  <span
                    className="analytics-row__bar"
                    style={{ width: `${(row.value / top) * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className="analytics-row__label">
                    {row.icon && (
                      <span className="analytics-row__icon" aria-hidden="true">
                        {row.icon}
                      </span>
                    )}
                    <span className="analytics-row__text">{row.label}</span>
                  </span>
                  <span className="analytics-row__value">
                    <span className="sr-only">{tab.column}: </span>
                    {row.display}
                  </span>
                  {tab.secondaryColumn && (
                    <span className="analytics-row__value">
                      <span className="sr-only">{tab.secondaryColumn}: </span>
                      {row.secondary}
                    </span>
                  )}
                </>
              );
              return (
                <li key={row.key}>
                  {row.href ? (
                    <Link
                      className="analytics-row"
                      href={row.href}
                      title={`Filter by ${row.label}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span className="analytics-row">{content}</span>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="analytics-panel__empty">{emptyText}</p>
        )}
        {tab.rows.length > collapsedRows && (
          <button
            type="button"
            className="analytics-panel__more"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show fewer' : `Show all ${tab.rows.length}`}
          </button>
        )}
      </div>
    </section>
  );
}
