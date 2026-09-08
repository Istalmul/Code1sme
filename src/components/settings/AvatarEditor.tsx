"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, Trash2, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

const OUTPUT_SIZE = 256;
const FRAME = 240;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/**
 * Avatar with a real crop step.
 *
 * The uploaded file is never stored as-is — it is drawn into a square canvas at
 * a fixed size, which both applies the user's framing and keeps the stored
 * image small enough to sit in a data URL.
 */
export function AvatarEditor({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: string;
  onChange: (next: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const image = useRef<HTMLImageElement | null>(null);

  function pickFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file — JPG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("That image is over 8MB. Try a smaller one.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSource(String(reader.result));
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.onerror = () => setError("We couldn't read that file. Try another.");
    reader.readAsDataURL(file);
  }

  const save = useCallback(() => {
    const img = image.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror exactly what the framed preview shows: cover-fit, then the user's
    // zoom and drag, scaled from preview pixels to output pixels.
    const scale = OUTPUT_SIZE / FRAME;
    const base = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight);
    const drawn = base * zoom * scale;
    const width = img.naturalWidth * drawn;
    const height = img.naturalHeight * drawn;
    const x = (OUTPUT_SIZE - width) / 2 + offset.x * scale;
    const y = (OUTPUT_SIZE - height) / 2 + offset.y * scale;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(img, x, y, width, height);
    onChange(canvas.toDataURL("image/jpeg", 0.88));
    setSource(null);
  }, [zoom, offset, onChange]);

  useEffect(() => {
    function stop() {
      dragging.current = null;
    }
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  if (source) {
    return (
      <div className="rounded-xl border border-line bg-surface p-card">
        <p className="text-[14px] font-medium text-body">Position your photo</p>
        <p className="mt-1 text-[13px] text-muted">Drag to move it, and use the slider to zoom.</p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-full border border-line-strong active:cursor-grabbing"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={(e) => {
            dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            setOffset({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={image}
            src={source}
            alt=""
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              width: FRAME,
              height: FRAME,
              objectFit: "cover",
            }}
          />
        </div>

        <label className="mt-4 block text-[13px] font-medium text-body" htmlFor="avatar-zoom">
          Zoom
        </label>
        <input
          id="avatar-zoom"
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-2 w-full accent-brand-600"
        />

        <div className="mt-5 flex gap-2">
          <Button fullWidth onClick={() => setSource(null)}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={save}>
            Save photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="relative shrink-0 rounded-full"
          aria-label={value ? "Profile photo options" : "Add a profile photo"}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="size-16 rounded-full object-cover ring-1 ring-line-strong"
            />
          ) : (
            // A person icon, not a question mark — the absence of a photo isn't
            // an error state.
            <span className="grid size-16 place-items-center rounded-full bg-sunken text-subtle ring-1 ring-line-strong">
              <User className="size-7" aria-hidden="true" />
            </span>
          )}
        </button>

        <div className="min-w-0">
          <p className="text-[14px] font-medium text-body">{name}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {value ? "Tap your photo to change or crop it." : "Tap to add a photo."}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 rounded-xl border border-line bg-sunken p-card">
          {value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Your profile photo"
              className="mx-auto size-32 rounded-full object-cover ring-1 ring-line-strong"
            />
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" aria-hidden="true" />
              {value ? "Change photo" : "Upload photo"}
            </Button>
            {value && (
              <>
                <Button size="sm" onClick={() => setSource(value)}>
                  <Crop className="size-4" aria-hidden="true" />
                  Crop
                </Button>
                <Button size="sm" onClick={() => onChange("")}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-on-bad">
          {error}
        </p>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
