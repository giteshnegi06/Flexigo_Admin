import { useState } from "react";
import { CalendarCheck, CircleX, Inbox, Loader2, PhoneCall, type LucideIcon } from "lucide-react";
import type { EnquiryStatus } from "../lib/api";

// One button per status, used on Enquiries and Messages instead of a dropdown. The current status is filled in
// its colour; clicking another one changes it straight away. A spinner shows on the button being saved.
const options: { value: EnquiryStatus; label: string; icon: LucideIcon; on: string }[] = [
  { value: "new", label: "New", icon: Inbox, on: "bg-amber-100 text-amber-900 ring-amber-300" },
  { value: "contacted", label: "Contacted", icon: PhoneCall, on: "bg-sky-100 text-sky-900 ring-sky-300" },
  { value: "booked", label: "Booked", icon: CalendarCheck, on: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  { value: "closed", label: "Closed", icon: CircleX, on: "bg-stone text-ink ring-muted/40" },
];

export function StatusButtons({ value, onChange, name }: { value: EnquiryStatus; onChange: (s: EnquiryStatus) => Promise<void>; name: string }) {
  const [saving, setSaving] = useState<EnquiryStatus | null>(null);

  async function pick(s: EnquiryStatus) {
    if (s === value || saving) return;
    setSaving(s);
    try {
      await onChange(s);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div role="group" aria-label={`Status of ${name}`} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted" aria-hidden>Status</span>
      {options.map(({ value: s, label, icon: Icon, on }) => {
        const current = s === value;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={current}
            disabled={!!saving}
            onClick={() => pick(s)}
            title={current ? `Status: ${label}` : `Mark as ${label.toLowerCase()}`}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 transition disabled:cursor-wait ${
              current ? `${on} ring-2` : "bg-white text-muted ring-line hover:bg-stone hover:text-forest"
            }`}
          >
            {saving === s ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Icon size={15} aria-hidden />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
