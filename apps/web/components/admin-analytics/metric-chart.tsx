'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  axisLabel,
  integer,
  relativeDay,
  tooltipLabel,
  type Change,
} from '@/lib/analytics/format';
import type { Interval, SeriesPoint } from '@/lib/analytics/queries';

export type MetricKey = 'visitors' | 'pageviews' | 'bounce';

export type MetricCard = {
  key: MetricKey;
  label: string;
  value: string;
  change: Change;
};

const pad = { top: 16, right: 16, bottom: 36, left: 52 };

function valueOf(point: SeriesPoint, metric: MetricKey) {
  if (metric === 'visitors') return point.visitors;
  if (metric === 'pageviews') return point.pageviews;
  return point.visits ? (point.bounces / point.visits) * 100 : null;
}

function format(value: number | null, metric: MetricKey) {
  if (value === null) return '—';
  return metric === 'bounce'
    ? `${Math.round(value)}%`
    : integer.format(Math.round(value));
}

/** A rounded top value and evenly spaced ticks from zero. */
function ticks(max: number, metric: MetricKey) {
  if (metric === 'bounce') return [0, 25, 50, 75, 100];
  const top = Math.max(max, 4);
  const raw = top / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n >= raw) ??
    10 * magnitude;
  return Array.from({ length: Math.ceil(top / step) + 1 }, (_, i) => i * step);
}

/** Path through the points, broken where a value is missing. */
function linePath(points: Array<[number, number] | null>) {
  let path = '';
  let open = false;
  for (const point of points) {
    if (!point) {
      open = false;
      continue;
    }
    path += `${open ? 'L' : 'M'}${point[0]},${point[1]}`;
    open = true;
  }
  return path;
}

export function MetricChart({
  cards,
  series,
  interval,
  partial,
}: {
  cards: MetricCard[];
  series: SeriesPoint[];
  interval: Interval;
  /** The last bucket is still in progress, so its segment is dashed. */
  partial: boolean;
}) {
  const id = useId();
  const [metric, setMetric] = useState<MetricKey>('visitors');
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(960);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = width < 560 ? 240 : 320;
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = series.map((point) => valueOf(point, metric));
  const scale = ticks(Math.max(0, ...values.map((v) => v ?? 0)), metric);
  const top = scale[scale.length - 1]!;
  const x = (index: number) =>
    series.length === 1
      ? pad.left + plotWidth / 2
      : pad.left + (index / (series.length - 1)) * plotWidth;
  const y = (value: number) =>
    pad.top + plotHeight - (value / top) * plotHeight;
  const points = values.map((value, index) =>
    value === null ? null : ([x(index), y(value)] as [number, number]),
  );

  const dashed = partial && series.length > 1;
  const solid = linePath(dashed ? points.slice(0, -1) : points);
  const tail =
    dashed && points.at(-2) && points.at(-1) ? linePath(points.slice(-2)) : '';
  const filled = points.filter(Boolean) as Array<[number, number]>;
  const area =
    filled.length > 1
      ? `${linePath(points)}L${filled.at(-1)![0]},${pad.top + plotHeight}L${filled[0]![0]},${pad.top + plotHeight}Z`
      : '';

  // Enough axis labels to fill the width without overlapping.
  const room = Math.max(2, Math.floor(plotWidth / 76));
  const every = Math.max(1, Math.ceil(series.length / room));
  const labelled = series
    .map((_, index) => index)
    .filter(
      (index) =>
        index % every === 0 &&
        (index === series.length - 1 || series.length - 1 - index >= every),
    );
  if (series.length > 1 && !labelled.includes(series.length - 1))
    labelled.push(series.length - 1);

  const selected = cards.find((card) => card.key === metric)!;
  const point = active === null ? null : series[active];
  const activeValue = active === null ? null : values[active]!;
  const activeX = active === null ? 0 : x(active);
  const relative = point
    ? relativeDay(point.bucket, interval, new Date())
    : null;

  function pick(clientX: number, target: Element) {
    if (!series.length) return;
    const box = target.getBoundingClientRect();
    const local = ((clientX - box.left) / box.width) * width;
    const index =
      series.length === 1
        ? 0
        : Math.round(((local - pad.left) / plotWidth) * (series.length - 1));
    setActive(Math.min(series.length - 1, Math.max(0, index)));
  }

  return (
    <section className="analytics-card" aria-label="Traffic over time">
      <div className="analytics-metrics" role="tablist" aria-label="Metric">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            role="tab"
            id={`${id}-${card.key}`}
            aria-selected={card.key === metric}
            aria-controls={`${id}-chart`}
            className="analytics-metric"
            onClick={() => setMetric(card.key)}
          >
            <span className="analytics-metric__label">{card.label}</span>
            <span className="analytics-metric__row">
              <span className="analytics-metric__value">{card.value}</span>
              {card.change && (
                <span
                  className={`analytics-delta analytics-delta--${card.change.tone}`}
                >
                  {card.change.text}
                  <span className="sr-only">
                    {' '}
                    compared with the previous period
                  </span>
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div
        id={`${id}-chart`}
        role="tabpanel"
        aria-labelledby={`${id}-${metric}`}
        className="analytics-plot"
      >
        <div
          ref={frame}
          className="analytics-plot__frame"
          tabIndex={0}
          aria-label={`${selected.label} by ${interval}. Use the arrow keys to read each point.`}
          onPointerMove={(event) => pick(event.clientX, event.currentTarget)}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (!series.length) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault();
              const step = event.key === 'ArrowRight' ? 1 : -1;
              setActive((current) =>
                Math.min(
                  series.length - 1,
                  Math.max(
                    0,
                    (current ?? (step > 0 ? -1 : series.length)) + step,
                  ),
                ),
              );
            } else if (event.key === 'Escape') setActive(null);
          }}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden="true"
          >
            {scale.map((tick) => (
              <g key={tick}>
                <line
                  className="analytics-plot__grid"
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y(tick)}
                  y2={y(tick)}
                />
                <text
                  className="analytics-plot__axis"
                  x={pad.left - 10}
                  y={y(tick) + 4}
                  textAnchor="end"
                >
                  {metric === 'bounce' ? `${tick}%` : integer.format(tick)}
                </text>
              </g>
            ))}
            {area && <path className="analytics-plot__area" d={area} />}
            <path className="analytics-plot__line" d={solid} />
            {tail && (
              <path
                className="analytics-plot__line analytics-plot__line--partial"
                d={tail}
              />
            )}
            {filled.length === 1 && (
              <circle
                className="analytics-plot__dot"
                cx={filled[0]![0]}
                cy={filled[0]![1]}
                r={4}
              />
            )}
            {labelled.map((index) =>
              index === active ? null : (
                <text
                  key={index}
                  className="analytics-plot__axis"
                  x={x(index)}
                  y={height - 12}
                  textAnchor={
                    series.length === 1
                      ? 'middle'
                      : index === 0
                        ? 'start'
                        : index === series.length - 1
                          ? 'end'
                          : 'middle'
                  }
                >
                  {axisLabel(series[index]!.bucket, interval)}
                </text>
              ),
            )}
            {point && (
              <g>
                <line
                  className="analytics-plot__cursor"
                  x1={activeX}
                  x2={activeX}
                  y1={pad.top}
                  y2={pad.top + plotHeight}
                />
                {activeValue !== null && (
                  <circle
                    className="analytics-plot__dot"
                    cx={activeX}
                    cy={y(activeValue)}
                    r={4.5}
                  />
                )}
              </g>
            )}
          </svg>

          {point && (
            <>
              <div
                className="analytics-tooltip"
                style={{
                  left: activeX,
                  top: pad.top + 8,
                  transform:
                    activeX > width - 200
                      ? 'translateX(calc(-100% - 12px))'
                      : 'translateX(12px)',
                }}
              >
                <span className="analytics-tooltip__value">
                  <span className="analytics-tooltip__swatch" />
                  {selected.label}
                  <strong>{format(activeValue, metric)}</strong>
                </span>
                <span className="analytics-tooltip__date">
                  {tooltipLabel(point.bucket, interval)}
                  {partial && active === series.length - 1 && ' (so far)'}
                </span>
              </div>
              <span
                className="analytics-plot__pill"
                style={{
                  left: Math.min(Math.max(activeX, pad.left + 40), width - 50),
                  top: height - 30,
                }}
              >
                {relative ?? axisLabel(point.bucket, interval)}
              </span>
            </>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {point
            ? `${tooltipLabel(point.bucket, interval)}: ${format(activeValue, metric)} ${selected.label.toLowerCase()}`
            : ''}
        </p>
        <details className="analytics-table">
          <summary>Show as a table</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Visitors</th>
                <th scope="col">Page views</th>
                <th scope="col">Bounce rate</th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr key={row.bucket}>
                  <td>{tooltipLabel(row.bucket, interval)}</td>
                  <td>{integer.format(row.visitors)}</td>
                  <td>{integer.format(row.pageviews)}</td>
                  <td>{format(valueOf(row, 'bounce'), 'bounce')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}
