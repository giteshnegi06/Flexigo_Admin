import { useCallback, useEffect, useState } from "react";
import { Download, Phone } from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import { api, inr, prettyDate, type Enquiry, type EnquiryStatus } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

const statuses: EnquiryStatus[] = ["new", "contacted", "booked", "closed"];
const badge: Record<EnquiryStatus, string> = {
  new: "bg-amber-100 text-amber-900",
  contacted: "bg-sky-100 text-sky-900",
  booked: "bg-emerald-100 text-emerald-900",
  closed: "bg-stone text-muted",
};

function toCsv(rows: Enquiry[]) {
  const cols = ["id", "createdAt", "home", "checkIn", "checkOut", "adults", "children", "name", "phone", "email", "quotedTotal", "status", "message", "sourcePage"] as const;
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\r\n");
}

export function EnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api<Enquiry[]>(`/admin/enquiries${filter === "all" ? "" : `?status=${filter}`}`)
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);
  useEffect(load, [load]);

  async function change(id: number, status: EnquiryStatus) {
    setError(null);
    try {
      await api(`/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function exportCsv() {
    // CSV opens directly in Excel; the BOM keeps the rupee sign and names readable.
    const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `flexigo-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageTitle title="Enquiries">
        <button onClick={exportCsv} disabled={!rows.length} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-forest hover:bg-forest hover:text-white disabled:opacity-50">
          <Download size={16} aria-hidden /> Export to Excel
        </button>
      </PageTitle>
      <ErrorNote message={error} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {(["all", ...statuses] as const).map((s) => (
          <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)} className={`min-h-11 rounded-full px-4 text-sm font-medium capitalize ${filter === s ? "bg-forest text-white" : "bg-white text-forest ring-1 ring-line"}`}>
            {s}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-muted ring-1 ring-line">No enquiries in this list.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((e) => (
            <li key={e.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-forest">#{e.id} · {e.name}</p>
                  <p className="text-sm text-muted">{e.home} · {prettyDate(e.checkIn)} to {prettyDate(e.checkOut)} · {e.adults} adults{e.children ? `, ${e.children} children` : ""}</p>
                  <p className="mt-1 text-sm text-forest">Quoted {inr(e.quotedTotal)} · received {prettyDate(e.createdAt)}</p>
                  {e.message && <p className="mt-2 max-w-2xl text-sm text-ink">“{e.message}”</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[e.status]}`}>{e.status}</span>
                  <label className="sr-only" htmlFor={`status-${e.id}`}>Change status</label>
                  <select id={`status-${e.id}`} value={e.status} onChange={(ev) => change(e.id, ev.target.value as EnquiryStatus)} className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm capitalize">
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-stone px-4 font-medium text-forest"><Phone size={14} aria-hidden /> {e.phone}</a>
                <a href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-stone px-4 font-medium text-forest"><WhatsAppIcon size={15} /> WhatsApp</a>
                <a href={`mailto:${e.email}`} className="inline-flex min-h-11 items-center rounded-full bg-stone px-4 font-medium text-forest">{e.email}</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
