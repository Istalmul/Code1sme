"use client";

import { useRef, useState } from "react";
import type { DailyRow } from "@/lib/piasowo/sample-data";

/**
 * Sent and replied per day.
 *
 * Both series count the same kind of thing, so they share one axis — a second
 * scale would let almost any shape be drawn from the same numbers. The two hues
 * are fixed categorical slots, validated for colour-vision separation against
 * both the light and dark chart surface. They are deliberately not the user's
 * accent, which can change underneath them.
 */

const W = 720;
const H = 220;
const PAD = { top: 12, right: 62, bottom: 28, left: 34 };

const SERIES = [
  { key: "sent", label: "Sent", varName: "--series-1" },
  { key: "replied", label: "Replied", varName: "--series-2" },
] as const;

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function TrendChart({ rows }: { rows: DailyRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  const peak = Math.max(4, ...rows.flatMap((r) => [r.sent, r.replied]));
  const top = Math.ceil(peak / 2) * 2;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (i / Math.max(1, rows.length - 1)) * plotW;
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  function pointerToIndex(clientX: number) {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return null;
    const svgX = ((clientX - box.left) / box.width) * W;
    const i = Math.round(((svgX - PAD.left) / plotW) * (rows.length - 1));
    return Math.min(rows.length - 1, Math.max(0, i));
  }

  const active = hover === null ? null : rows[hover];

  return (
    <div>
      {/* A legend is always present for two series, and each line is also
          labelled at its end — identity never rests on colour alone. */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-2 text-[13px] text-muted">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: `var(${series.varName})` }}
            />
            {series.label}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="ml-auto rounded text-[13px] font-medium text-link hover:underline"
        >
          {showTable ? "Hide table" : "Show as table"}
        </button>
      </div>

      <div className="relative">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Messages sent and replies received per day over the last ${rows.length} days`}
          onPointerMove={(e) => setHover(pointerToIndex(e.clientX))}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((step) => {
            const value = Math.round(top * (1 - step));
            const gy = PAD.top + step * plotH;
            return (
              <g key={step}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={gy}
                  y2={gy}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text x={PAD.left - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="var(--text-subtle)">
                  {value}
                </text>
              </g>
            );
          })}

          {rows.map((row, i) =>
            i % 3 === 0 || i === rows.length - 1 ? (
              <text
                key={row.date}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-subtle)"
              >
                {shortDate(row.date)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--border-strong)"
              strokeWidth="1"
            />
          )}

          {SERIES.map((series) => {
            const path = rows
              .map((row, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(row[series.key])}`)
              .join(" ");
            const last = rows[rows.length - 1][series.key];
            return (
              <g key={series.key}>
                <path
                  d={path}
                  fill="none"
                  stroke={`var(${series.varName})`}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <text
                  x={W - PAD.right + 8}
                  y={y(last) + 4}
                  fontSize="12"
                  fontWeight="600"
                  fill={`var(${series.varName})`}
                >
                  {series.label}
                </text>
                {hover !== null && (
                  // A surface ring keeps both markers legible where the series
                  // cross each other.
                  <circle
                    cx={x(hover)}
                    cy={y(rows[hover][series.key])}
                    r="5"
                    fill={`var(${series.varName})`}
                    stroke="var(--surface)"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {active && hover !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 rounded-lg border border-line bg-surface px-3 py-2 shadow-pop"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: hover > rows.length / 2 ? "translateX(-108%)" : "translateX(8%)",
            }}
          >
            <p className="text-[12px] font-medium text-body">{shortDate(active.date)}</p>
            {SERIES.map((series) => (
              <p key={series.key} className="mt-1 flex items-center gap-2 text-[12px] text-muted">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: `var(${series.varName})` }}
                />
                {series.label}
                <span className="ml-3 font-semibold tabular-nums text-body">
                  {active[series.key]}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      {showTable && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13px]">
            <caption className="sr-only">Daily activity for the last {rows.length} days</caption>
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="py-2 font-medium">Date</th>
                <th scope="col" className="py-2 text-right font-medium">Researched</th>
                <th scope="col" className="py-2 text-right font-medium">Opportunities</th>
                <th scope="col" className="py-2 text-right font-medium">Sent</th>
                <th scope="col" className="py-2 text-right font-medium">Replied</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((row) => (
                <tr key={row.date} className="border-b border-line last:border-0">
                  <td className="py-2 text-body">{shortDate(row.date)}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{row.researched}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{row.opportunities}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{row.sent}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{row.replied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
