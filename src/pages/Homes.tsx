import { useEffect, useState } from "react";
import { api, type Home } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

type Draft = Pick<Home, "tagline" | "summary" | "nightlyPrice" | "weekendPrice" | "compareAtPrice" | "minNights" | "maxGuests" | "wifiMbps" | "icalUrl" | "isActive">;

function HomeEditor({ home, onSaved }: { home: Home; onSaved: (h: Home) => void }) {
  const [draft, setDraft] = useState<Draft>(home);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const num = (v: string) => (v === "" ? null : Number(v));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const saved = await api<Home>(`/admin/homes/${home.id}`, { method: "PUT", body: JSON.stringify({ ...draft, icalUrl: draft.icalUrl || null }) });
      onSaved(saved);
      setNote({ ok: true, text: "Saved. The website updates within 10 minutes." });
    } catch (err) {
      setNote({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-forest";
  const label = "text-sm font-medium text-forest";
  return (
    <form onSubmit={save} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <img src={home.coverPhoto} alt="" className="h-16 w-24 rounded-xl object-cover" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-forest">{home.name}</h2>
          <p className="text-sm text-muted">/{home.slug}</p>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-forest">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-forest" /> Shown on website
        </label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>Weeknight price (₹)<input type="number" min={0} required value={draft.nightlyPrice} onChange={(e) => set("nightlyPrice", Number(e.target.value))} className={input} /></label>
        <label className={label}>Friday and Saturday (₹)<input type="number" min={0} required value={draft.weekendPrice} onChange={(e) => set("weekendPrice", Number(e.target.value))} className={input} /></label>
        <label className={label}>Was price (₹, optional)<input type="number" min={0} value={draft.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", num(e.target.value))} className={input} /></label>
        <label className={label}>Minimum nights<input type="number" min={1} max={30} required value={draft.minNights} onChange={(e) => set("minNights", Number(e.target.value))} className={input} /></label>
        <label className={label}>Maximum guests<input type="number" min={1} max={20} required value={draft.maxGuests} onChange={(e) => set("maxGuests", Number(e.target.value))} className={input} /></label>
        <label className={label}>Wi-Fi speed (Mbps)<input type="number" min={0} value={draft.wifiMbps ?? ""} onChange={(e) => set("wifiMbps", num(e.target.value))} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>Airbnb calendar link (iCal)<input type="url" value={draft.icalUrl ?? ""} onChange={(e) => set("icalUrl", e.target.value)} placeholder="https://www.airbnb.co.in/calendar/ical/..." className={input} /></label>
        <label className={`${label} sm:col-span-2 lg:col-span-4`}>Tagline<input maxLength={200} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} className={input} /></label>
        <label className={`${label} sm:col-span-2 lg:col-span-4`}>Summary<textarea rows={3} maxLength={2000} value={draft.summary} onChange={(e) => set("summary", e.target.value)} className={input} /></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button disabled={busy} className="min-h-11 rounded-[10px] bg-forest px-6 font-semibold text-white hover:bg-forest-soft disabled:opacity-60">{busy ? "Saving..." : "Save changes"}</button>
        {note && <p role="status" className={`text-sm ${note.ok ? "text-emerald-800" : "text-red-700"}`}>{note.text}</p>}
      </div>
    </form>
  );
}

export function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Home[]>("/admin/homes").then(setHomes).catch((e: Error) => setError(e.message));
  }, []);
  return (
    <>
      <PageTitle title="Homes and prices" />
      <ErrorNote message={error} />
      <div className="grid gap-5">
        {homes.map((h) => (
          <HomeEditor key={h.id} home={h} onSaved={(s) => setHomes((hs) => hs.map((x) => (x.id === s.id ? s : x)))} />
        ))}
      </div>
    </>
  );
}
