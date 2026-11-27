import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, type Location } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

// Locations appear as photo cards under the home page hero. Each card opens a page listing that location's homes.
type Draft = { name: string; description: string; image: string; imageAlt: string; sortOrder: number; isActive: boolean };
const empty: Draft = { name: "", description: "", image: "", imageAlt: "", sortOrder: 0, isActive: true };

const input = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-forest";
const label = "block text-sm font-medium text-forest";

function LocationForm({ start, submitLabel, onSave, onCancel }: { start: Draft; submitLabel: string; onSave: (d: Draft) => Promise<void>; onCancel?: () => void }) {
  const [d, setD] = useState<Draft>(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave(d);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[12rem_1fr]">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-stone">
        {d.image && <img src={d.image} alt="" className="size-full object-cover" />}
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2">
        <label className={label}>Name<input required minLength={2} maxLength={80} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="For example, Kasauli" className={input} /></label>
        <label className={label}>Order on the website<input type="number" min={0} max={999} value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>Card photo address<input type="url" required value={d.image} onChange={(e) => set("image", e.target.value)} placeholder="https://images.unsplash.com/photo-..." className={input} /></label>
        <label className={`${label} sm:col-span-2`}>Photo description<input required minLength={3} maxLength={200} value={d.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} placeholder="For example, Kasauli hills at sunset" className={input} /></label>
        <label className={`${label} sm:col-span-2`}>Intro shown on the location page<textarea rows={2} maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} className={input} /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-forest sm:col-span-2">
          <input type="checkbox" checked={d.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-forest" /> Shown on website
        </label>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button disabled={busy} className="min-h-11 rounded-[10px] bg-forest px-6 text-sm font-semibold text-white hover:bg-forest-soft disabled:opacity-60">{busy ? "Saving..." : submitLabel}</button>
          {onCancel && <button type="button" onClick={onCancel} className="min-h-11 rounded-[10px] px-4 text-sm font-semibold text-forest hover:bg-stone">Cancel</button>}
        </div>
      </div>
    </form>
  );
}

export function LocationsPage() {
  const [rows, setRows] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(() => {
    api<Location[]>("/admin/locations").then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function remove(l: Location) {
    if (!window.confirm(`Remove ${l.name}? Its card disappears from the website.`)) return;
    setError(null);
    try {
      await api(`/admin/locations/${l.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <PageTitle title="Locations" />
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted">Each location is a photo card under the home page hero. Guests click it to see every home there. Choose a home's location on the Homes page.</p>
      <ErrorNote message={error} />
      {adding ? (
        <div className="mb-6 rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="mb-4 text-lg font-semibold text-forest">New location</h2>
          <LocationForm
            start={{ ...empty, sortOrder: rows.length }}
            submitLabel="Add location"
            onCancel={() => setAdding(false)}
            onSave={async (d) => {
              await api("/admin/locations", { method: "POST", body: JSON.stringify(d) });
              setAdding(false);
              load();
            }}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-soft">
          <Plus size={18} aria-hidden /> Add a location
        </button>
      )}
      <ul className="grid gap-4">
        {rows.map((l) => (
          <li key={l.id} className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
            {editing === l.id ? (
              <LocationForm
                start={l}
                submitLabel="Save changes"
                onCancel={() => setEditing(null)}
                onSave={async (d) => {
                  await api(`/admin/locations/${l.id}`, { method: "PUT", body: JSON.stringify(d) });
                  setEditing(null);
                  load();
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <img src={l.image} alt="" className="h-20 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-forest">{l.name} {!l.isActive && <span className="ml-1 rounded-full bg-stone px-2 py-0.5 text-xs text-muted">Hidden</span>}</p>
                  <p className="text-sm text-muted">{l.homes} {l.homes === 1 ? "home" : "homes"} · /locations/{l.slug}</p>
                </div>
                <button onClick={() => setEditing(l.id)} className="min-h-11 rounded-[10px] px-4 text-sm font-semibold text-forest ring-1 ring-line hover:bg-stone">Edit</button>
                <button onClick={() => remove(l)} aria-label={`Remove ${l.name}`} className="grid size-11 place-items-center rounded-full text-muted hover:bg-stone hover:text-rose-700"><Trash2 size={18} aria-hidden /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
