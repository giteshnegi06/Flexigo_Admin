import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import { api, prettyDate, type ContactRequest, type EnquiryStatus } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

// Call back requests from the website's "Get in touch" popup.
const statuses: EnquiryStatus[] = ["new", "contacted", "booked", "closed"];
const badge: Record<EnquiryStatus, string> = {
  new: "bg-amber-100 text-amber-900",
  contacted: "bg-sky-100 text-sky-900",
  booked: "bg-emerald-100 text-emerald-900",
  closed: "bg-stone text-muted",
};

export function MessagesPage() {
  const [rows, setRows] = useState<ContactRequest[]>([]);
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<ContactRequest[]>("/admin/contact-requests")
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  async function change(id: number, status: EnquiryStatus) {
    setError(null);
    try {
      await api(`/admin/contact-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  return (
    <>
      <PageTitle title="Messages" />
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted">People who asked for a call back from the "Get in touch" popup on the website.</p>
      <ErrorNote message={error} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {(["all", ...statuses] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`min-h-11 rounded-full px-4 text-sm font-semibold capitalize ${filter === s ? "bg-forest text-white" : "bg-white text-forest ring-1 ring-line"}`}>
            {s}
          </button>
        ))}
      </div>
      <ul className="grid gap-3">
        {shown.map((m) => (
          <li key={m.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-forest">#{m.id} · {m.name}</p>
                <p className="text-sm text-muted">Received {prettyDate(m.createdAt)}{m.sourcePage ? ` · from ${m.sourcePage}` : ""}</p>
                {m.message && <p className="mt-2 max-w-2xl text-sm text-ink">“{m.message}”</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[m.status]}`}>{m.status}</span>
                <label className="sr-only" htmlFor={`msg-status-${m.id}`}>Change status</label>
                <select id={`msg-status-${m.id}`} value={m.status} onChange={(e) => change(m.id, e.target.value as EnquiryStatus)} className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm capitalize">
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-stone px-4 font-medium text-forest"><Phone size={14} aria-hidden /> {m.phone}</a>
              <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-stone px-4 font-medium text-forest"><WhatsAppIcon size={15} /> WhatsApp</a>
            </div>
          </li>
        ))}
        {loaded && !shown.length && <li className="rounded-2xl bg-white px-4 py-6 text-sm text-muted ring-1 ring-line">No messages here yet.</li>}
      </ul>
    </>
  );
}
