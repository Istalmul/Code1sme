import { AlertTriangle, CheckCircle2, HelpCircle, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Contact, Prospect } from "@/lib/piasowo/types";

const VERIFICATION = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    classes: "bg-tint-good text-on-good ring-on-good/30",
    note: "This address was checked and accepted mail.",
  },
  risky: {
    label: "Risky",
    icon: AlertTriangle,
    classes: "bg-tint-warn text-on-warn ring-on-warn/30",
    note: "A shared or catch-all address. It may bounce, which costs you sender reputation.",
  },
  unverified: {
    label: "No address found",
    icon: HelpCircle,
    classes: "bg-sunken text-muted ring-line-strong",
    note: "No email was found, so this one has to go out on LinkedIn instead.",
  },
} as const;

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[12px] text-subtle">{label}</p>
        <p className="break-all text-[13px] text-body">{value}</p>
      </div>
    </div>
  );
}

/**
 * Who the message goes to, through which channel, and whether the address is
 * safe to use. Verification is shown before the draft is approved rather than
 * discovered afterwards through a bounce.
 */
export function ContactCard({ prospect }: { prospect: Prospect }) {
  const contact: Contact = prospect.contact;
  const verification = VERIFICATION[contact.verification];
  const Icon = verification.icon;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight">Contact</h2>
        <p className="mt-1 text-[14px] font-medium text-body">{contact.name}</p>
        <p className="text-[13px] text-muted">{contact.title}</p>

        <span
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ${verification.classes}`}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {verification.label}
        </span>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{verification.note}</p>
      </div>

      <div className="divide-y divide-[color:var(--border)] px-5 py-1">
        {contact.email && <Row icon={Mail} label="Email" value={contact.email} />}
        {contact.whatsapp && <Row icon={MessageCircle} label="WhatsApp" value={contact.whatsapp} />}
        {contact.phone && <Row icon={Phone} label="Phone" value={contact.phone} />}
        {contact.linkedin && <Row icon={MessageCircle} label="LinkedIn" value={contact.linkedin} />}
        <Row icon={MapPin} label="Found via" value={prospect.foundVia} />
      </div>
    </section>
  );
}
