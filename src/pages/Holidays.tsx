import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, prettyDate, type Holiday } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

// Holidays and festivals highlighted in the website date picker. Lunar festivals move every year,
// so check next year's dates when the government list comes out (usually in June).
export function HolidaysPage() {
  const [rows, setRows] = useState<Holiday[]>([]);
  const [day, setDay] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

  const load = useCallback(() => {
    api<Holiday[]>("/admin/holidays").then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/admin/holidays", { method: "POST", body: JSON.stringify({ day, name }) });
      setDay("");
      setName("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(h: Holiday) {
    if (!window.confirm(`Remove ${h.name} (${prettyDate(h.day)}) from the date picker?`)) return;
    setError(null);
    try {
      await api(`/admin/holidays/${h.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const upcoming = rows.filter((h) => h.day >= today);
  const past = rows.length - upcoming.length;

  return (
    <>
      <PageTitle title="Holidays" />
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted">These dates are highlighted in the website calendar, and listed under it so guests can plan long weekends. Adding a date that already exists renames it.</p>
      <ErrorNote message={error} />
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <label className="flex flex-col gap-1 text-sm font-medium text-forest">
          Date
          <input type="date" required value={day} onChange={(e) => setDay(e.target.value)} className="min-h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm font-medium text-forest">
          Name
          <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Diwali" className="min-h-11 rounded-xl border border-line px-3" />
        </label>
        <button disabled={busy} className="min-h-11 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white disabled:opacity-50">Add holiday</button>
      </form>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <ul className="divide-y divide-line">
          {upcoming.map((h) => (
            <li key={h.id} className="flex items-center gap-4 px-4 py-3">
              <span className="w-32 shrink-0 text-sm font-semibold text-forest">{prettyDate(h.day)}</span>
              <span className="flex-1 text-sm text-ink">{h.name}</span>
              <button onClick={() => remove(h)} aria-label={`Remove ${h.name}`} className="grid size-10 place-items-center rounded-full text-muted hover:bg-stone hover:text-rose-700"><Trash2 size={18} aria-hidden /></button>
            </li>
          ))}
          {!upcoming.length && <li className="px-4 py-6 text-sm text-muted">No upcoming holidays. Add next year's dates above.</li>}
        </ul>
      </div>
      {past > 0 && <p className="mt-3 text-xs text-muted">{past} past {past === 1 ? "date is" : "dates are"} hidden. Guests never see past holidays.</p>}
    </>
  );
}
