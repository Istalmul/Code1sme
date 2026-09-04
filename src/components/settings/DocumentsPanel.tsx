"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { WorkspaceDocument } from "@/lib/auth/store";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Proof points the AI writes from.
 *
 * Drafts built only from the prospect's signals can say why they matter but
 * never why *you* are worth a reply. These documents are where that comes
 * from — a case study, a result, a CV.
 */
export function DocumentsPanel({
  documents,
  employeeName,
}: {
  documents: WorkspaceDocument[];
  employeeName: string;
}) {
  const router = useRouter();
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function add(name: string, text: string) {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addDocument: { name, text } }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Couldn't save that. Please try again.");
      return;
    }
    setPasted("");
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeDocumentId: id }),
    });
    setBusy(false);
    router.refresh();
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("That file is over 5MB. Try a shorter one.");
      return;
    }

    const lower = file.name.toLowerCase();
    setBusy(true);
    try {
      let text: string;
      if (lower.endsWith(".docx")) {
        // Parsed in the browser so the file itself never leaves the device —
        // only the extracted text is stored.
        const mammoth = await import("mammoth/mammoth.browser");
        const buffer = await file.arrayBuffer();
        text = (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
      } else if (/\.(txt|md|csv)$/.test(lower)) {
        text = await file.text();
      } else {
        setBusy(false);
        setError(
          lower.endsWith(".pdf")
            ? "PDFs can't be read here yet — export it as .docx or .txt, or paste the text below."
            : "Supported files: .docx, .txt, .md, .csv. Or paste the text below.",
        );
        return;
      }

      if (!text.trim()) {
        setBusy(false);
        setError("We couldn't find any text in that file.");
        return;
      }
      setBusy(false);
      await add(file.name, text.trim().slice(0, 200_000));
    } catch {
      setBusy(false);
      setError("We couldn't read that file. Try another, or paste the text below.");
    }
  }

  return (
    <div className="space-y-4">
      {documents.length > 0 ? (
        <ul className="divide-y divide-[color:var(--border)] overflow-hidden rounded-xl border border-line">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-start gap-3 px-3.5 py-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-body">{doc.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                  {doc.text.slice(0, 160)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(doc.id)}
                disabled={busy}
                aria-label={`Remove ${doc.name}`}
                className="rounded-md p-1.5 text-subtle hover:bg-hover hover:text-on-bad"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center">
          <p className="text-[14px] font-medium text-body">No proof points yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
            Without these, {employeeName} can explain why a prospect matters but not why you&apos;re
            worth replying to. One result or case study per line is enough.
          </p>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div>
        <label htmlFor="paste-proof" className="mb-1.5 block text-[13px] font-medium text-body">
          Add a proof point
        </label>
        <textarea
          id="paste-proof"
          rows={3}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Helped Ridgeline Outdoor grow foot traffic 40% in one quarter"
          className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-body [field-sizing:content] placeholder:text-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/35"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={busy}
            disabled={!pasted.trim()}
            onClick={() => add("Pasted note", pasted.trim())}
          >
            Add
          </Button>
          <Button size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            Upload a file
          </Button>
        </div>
        <p className="mt-2 text-[13px] text-muted">
          Accepts .docx, .txt, .md and .csv. Files are read on your device — only the text is stored.
        </p>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".docx,.txt,.md,.csv"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
