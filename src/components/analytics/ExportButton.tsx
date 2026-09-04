"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** RFC 4180: quote every field, double any embedded quote. */
function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ].join("\r\n");
}

export function ExportButton({
  rows,
  filename,
  label,
}: {
  rows: Record<string, string | number>[];
  filename: string;
  label: string;
}) {
  const [done, setDone] = useState(false);

  function download() {
    // A BOM makes Excel open UTF-8 correctly instead of mangling accents.
    const blob = new Blob(["﻿", toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDone(true);
    window.setTimeout(() => setDone(false), 2500);
  }

  return (
    <Button size="sm" onClick={download} disabled={rows.length === 0}>
      <Download className="size-4" aria-hidden="true" />
      {done ? "Downloaded" : label}
    </Button>
  );
}
