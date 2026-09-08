import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "error" | "success" | "info";

const styles: Record<Tone, { box: string; icon: typeof Info }> = {
  error: { box: "border-on-bad/30 bg-tint-bad text-on-bad", icon: AlertCircle },
  success: { box: "border-on-good/30 bg-tint-good text-on-good", icon: CheckCircle2 },
  info: { box: "border-line-strong bg-sunken text-body", icon: Info },
};

/** Form-level messages only. Field-level errors belong under their field. */
export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  const { box, icon: Icon } = styles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] ${box}`}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
