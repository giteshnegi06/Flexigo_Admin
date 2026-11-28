import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, imgSrc, type Location } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";
import { FormSection, Modal } from "../components/Modal";
import { ImageUpload } from "../components/ImageUpload";

// Locations appear as photo cards under the home page hero. Each card opens a page listing that location's homes.
// "Add a location" and "Edit" open the same form in a popup.
type Draft = { name: string; description: string; image: string; imageAlt: string; sortOrder: number; isActive: boolean };

const input = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-forest";
const label = "block text-sm font-medium text-forest";

function LocationFormModal({ location, nextOrder, onClose, onSaved }: { location: Location | null; nextOrder: number; onClose: () => void; onSaved: (message: string) => void }) {
  const [d, setD] = useState<Draft>(location ?? { name: "", description: "", image: "", imageAlt: "", sortOrder: nextOrder, isActive: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const formId = "location-form";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!d.image) return setError("Upload a card photo.");
    setBusy(true);
    setError(null);
    const body = { name: d.name.trim(), description: d.description.trim(), image: d.image, imageAlt: d.imageAlt.trim() || `${d.name.trim()} view`, sortOrder: d.sortOrder, isActive: d.isActive };
    try {
      if (location) await api(`/admin/locations/${location.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/admin/locations", { method: "POST", body: JSON.stringify(body) });
      onSaved(`${body.name} ${location ? "saved" : "added"}. The website updates within 10 minutes.`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal
      wide={false}
      title={location ? `Edit ${location.name}` : "Add a location"}
      subtitle={location ? `/locations/${location.slug}` : "It appears as a card under the home page hero."}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <button form={formId} disabled={busy} className="min-h-11 rounded-[10px] bg-forest px-6 font-semibold text-white hover:bg-forest-soft disabled:opacity-60">{busy ? "Saving..." : location ? "Save changes" : "Add location"}</button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-[10px] px-4 text-sm font-semibold text-forest hover:bg-stone">Cancel</button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      }
    >
      <form id={formId} onSubmit={save}>
        <FormSection title="Details">
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <label className={label}>Name *<input required minLength={2} maxLength={80} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="For example, Kasauli" className={input} /></label>
            <label className={label}>Order<input type="number" min={0} max={999} value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className={input} /></label>
            <label className={`${label} sm:col-span-2`}>Intro shown on the location page<textarea rows={3} maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="One or two sentences about staying here." className={input} /></label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-forest sm:col-span-2">
              <input type="checkbox" checked={d.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-forest" /> Shown on website
            </label>
          </div>
        </FormSection>
        <FormSection title="Card photo" hint="A tall photo of the place works best, like a view or a landmark.">
          <ImageUpload label="Photo" required aspect="aspect-[4/5]" value={d.image} onChange={(url) => set("image", url)} />
          <label className={`${label} mt-4`}>Photo description<input maxLength={200} value={d.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} placeholder="For example, Kasauli hills at sunset" className={input} /></label>
        </FormSection>
      </form>
    </Modal>
  );
}

export function LocationsPage() {
  const [rows, setRows] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ location: Location | null } | null>(null);
  const [done, setDone] = useState<string | null>(null);

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
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted">Each location is a photo card under the home page hero. Guests click it to see every property there. Choose a property's location when you add or edit the property.</p>
      <ErrorNote message={error} />
      {done && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{done}</p>}
      <button onClick={() => { setOpen({ location: null }); setDone(null); }} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-soft">
        <Plus size={18} aria-hidden /> Add a location
      </button>
      <ul className="grid gap-3">
        {rows.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
            <img src={imgSrc(l.image)} alt="" className="h-20 w-16 rounded-xl bg-stone object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-forest">{l.name} {!l.isActive && <span className="ml-1 rounded-full bg-stone px-2 py-0.5 text-xs text-muted">Hidden</span>}</p>
              <p className="text-sm text-muted">{l.homes} {l.homes === 1 ? "property" : "properties"} · /locations/{l.slug}</p>
            </div>
            <button onClick={() => { setOpen({ location: l }); setDone(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold text-forest ring-1 ring-line hover:bg-stone"><Pencil size={16} aria-hidden /> Edit</button>
            <button onClick={() => remove(l)} aria-label={`Remove ${l.name}`} className="grid size-11 place-items-center rounded-full text-muted hover:bg-stone hover:text-rose-700"><Trash2 size={18} aria-hidden /></button>
          </li>
        ))}
      </ul>
      {open && (
        <LocationFormModal
          key={open.location?.id ?? "new"}
          location={open.location}
          nextOrder={rows.length}
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setOpen(null);
            setDone(message);
            load();
          }}
        />
      )}
    </>
  );
}
