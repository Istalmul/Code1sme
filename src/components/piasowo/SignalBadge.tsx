import { Banknote, Building2, Cpu, Newspaper, UserRoundCog, Users } from "lucide-react";
import type { SignalKind } from "@/lib/piasowo/types";
import { SIGNAL_LABELS } from "@/lib/piasowo/recommend";

const ICONS: Record<SignalKind, typeof Users> = {
  hiring: Users,
  funding: Banknote,
  expansion: Building2,
  "tech-change": Cpu,
  leadership: UserRoundCog,
  news: Newspaper,
};

export function SignalBadge({ kind }: { kind: SignalKind }) {
  const Icon = ICONS[kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-[12px] font-medium text-muted ring-1 ring-line">
      <Icon className="size-3.5" aria-hidden="true" />
      {SIGNAL_LABELS[kind].label}
    </span>
  );
}
