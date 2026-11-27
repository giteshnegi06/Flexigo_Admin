import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, type Home, type Location, type PropertyType } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

type Draft = Pick<
  Home,
  | "name"
  | "locationId"
  | "propertyType"
  | "area"
  | "bedrooms"
  | "bathrooms"
  | "coverPhoto"
  | "tagline"
  | "summary"
  | "nightlyPrice"
  | "weekendPrice"
  | "compareAtPrice"
  | "minNights"
  | "maxGuests"
  | "wifiMbps"
  | "icalUrl"
  | "isActive"
  | "mapLat"
  | "mapLng"
  | "mapExact"
>;

const input = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-forest";
const label = "text-sm font-medium text-forest";
const num = (v: string) => (v === "" ? null : Number(v));

// Reads "31.0676, 77.1828" or a Google Maps link that contains the point (…/@31.0676,77.1828,… or ?q=31.0676,77.1828).
function parsePin(text: string): { lat: number; lng: number } | null {
  const m = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

// Photos are typed one per line: the image address, then optionally " | " and a short description.
const photosToText = (photos: { url: string; alt: string }[]) => photos.map((p) => (p.alt ? `${p.url} | ${p.alt}` : p.url)).join("\n");
function textToPhotos(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, ...rest] = line.split("|");
      return { url: url.trim(), alt: rest.join("|").trim() || undefined };
    });
}

function Field({ text, className = "", children }: { text: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`${label} ${className}`}>
      {text}
      {children}
    </label>
  );
}

// Name, place and type: shared by the editor and the new home form.
function PlaceFields({ draft, set, locations }: { draft: Pick<Draft, "name" | "locationId" | "propertyType" | "area">; set: (k: "name" | "locationId" | "propertyType" | "area", v: string | number | null) => void; locations: Location[] }) {
  return (
    <>
      <Field text="Home name" className="sm:col-span-2"><input required minLength={2} maxLength={120} value={draft.name} onChange={(e) => set("name", e.target.value)} className={input} /></Field>
      <Field text="Location">
        <select required value={draft.locationId ?? ""} onChange={(e) => set("locationId", num(e.target.value))} className={input}>
          <option value="" disabled>Choose a location</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field text="Type">
        <select value={draft.propertyType} onChange={(e) => set("propertyType", e.target.value as PropertyType)} className={input}>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
        </select>
      </Field>
      <Field text="Area (optional)" className="sm:col-span-2"><input maxLength={80} value={draft.area ?? ""} onChange={(e) => set("area", e.target.value)} placeholder="For example, Panthaghati" className={input} /></Field>
    </>
  );
}

function HomeEditor({ home, locations, onSaved }: { home: Home; locations: Location[]; onSaved: (h: Home) => void }) {
  const [draft, setDraft] = useState<Draft>(home);
  const [pinText, setPinText] = useState(home.mapLat != null && home.mapLng != null ? `${home.mapLat}, ${home.mapLng}` : "");
  const [photosText, setPhotosText] = useState(photosToText(home.photos));
  const pin = parsePin(pinText);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const photos = textToPhotos(photosText);
      const saved = await api<Home>(`/admin/homes/${home.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...draft, area: draft.area?.trim() || null, icalUrl: draft.icalUrl || null, mapLat: pin?.lat ?? null, mapLng: pin?.lng ?? null, mapExact: pin ? draft.mapExact : false }),
      });
      if (photosText !== photosToText(home.photos)) await api(`/admin/homes/${home.id}/photos`, { method: "PUT", body: JSON.stringify({ photos }) });
      onSaved({ ...saved, photos: photos.map((p) => ({ url: p.url, alt: p.alt ?? "" })) });
      setNote({ ok: true, text: "Saved. The website updates within 10 minutes." });
    } catch (err) {
      setNote({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <img src={draft.coverPhoto} alt="" className="h-16 w-24 rounded-xl object-cover" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-forest">{home.name}</h2>
          <p className="text-sm text-muted">/homes/{home.slug}</p>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-forest">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-forest" /> Shown on website
        </label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlaceFields draft={draft} set={(k, v) => set(k, v as never)} locations={locations} />
        <Field text="Weeknight price (₹)"><input type="number" min={0} required value={draft.nightlyPrice} onChange={(e) => set("nightlyPrice", Number(e.target.value))} className={input} /></Field>
        <Field text="Friday and Saturday (₹)"><input type="number" min={0} required value={draft.weekendPrice} onChange={(e) => set("weekendPrice", Number(e.target.value))} className={input} /></Field>
        <Field text="Was price (₹, optional)"><input type="number" min={0} value={draft.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", num(e.target.value))} className={input} /></Field>
        <Field text="Minimum nights"><input type="number" min={1} max={30} required value={draft.minNights} onChange={(e) => set("minNights", Number(e.target.value))} className={input} /></Field>
        <Field text="Maximum guests"><input type="number" min={1} max={20} required value={draft.maxGuests} onChange={(e) => set("maxGuests", Number(e.target.value))} className={input} /></Field>
        <Field text="Bedrooms"><input type="number" min={0} max={20} required value={draft.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} className={input} /></Field>
        <Field text="Bathrooms"><input type="number" min={0} max={20} required value={draft.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} className={input} /></Field>
        <Field text="Wi-Fi speed (Mbps)"><input type="number" min={0} value={draft.wifiMbps ?? ""} onChange={(e) => set("wifiMbps", num(e.target.value))} className={input} /></Field>
        <Field text="Airbnb calendar link (iCal)" className="sm:col-span-2 lg:col-span-4"><input type="url" value={draft.icalUrl ?? ""} onChange={(e) => set("icalUrl", e.target.value)} placeholder="https://www.airbnb.co.in/calendar/ical/..." className={input} /></Field>
        <Field text="Tagline" className="sm:col-span-2 lg:col-span-4"><input maxLength={200} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} className={input} /></Field>
        <Field text="Summary" className="sm:col-span-2 lg:col-span-4"><textarea rows={3} maxLength={2000} value={draft.summary} onChange={(e) => set("summary", e.target.value)} className={input} /></Field>
        <Field text="Cover photo address (shown on cards)" className="sm:col-span-2 lg:col-span-4"><input type="url" required value={draft.coverPhoto} onChange={(e) => set("coverPhoto", e.target.value)} className={input} /></Field>
        <Field text="Photos (one per line: image address | description)" className="sm:col-span-2 lg:col-span-4">
          <textarea rows={5} value={photosText} onChange={(e) => setPhotosText(e.target.value)} className={`${input} font-mono text-sm`} />
        </Field>
      </div>
      <fieldset className="mt-5 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold text-forest">Map pin (Location section on the website)</legend>
        <Field text="Google Maps link or coordinates">
          <input value={pinText} onChange={(e) => setPinText(e.target.value)} placeholder="31.0676, 77.1828 or a Google Maps link" className={input} />
        </Field>
        <p className={`mt-1 text-xs ${pinText && !pin ? "text-red-700" : "text-muted"}`}>
          {pinText && !pin ? (
            "Could not find a point in that. In Google Maps, right-click the building and click the numbers at the top to copy them, then paste here."
          ) : pin ? (
            <>
              Pin at {pin.lat}, {pin.lng}.{" "}
              <a href={`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline">Check it on Google Maps</a>
            </>
          ) : (
            "Leave empty to hide the map."
          )}
        </p>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm font-medium text-forest">
          <input type="checkbox" checked={draft.mapExact} disabled={!pin} onChange={(e) => set("mapExact", e.target.checked)} className="size-5 accent-forest" />
          This is the exact building (shows "Get directions"). Leave off to show the area only.
        </label>
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button disabled={busy} className="min-h-11 rounded-[10px] bg-forest px-6 font-semibold text-white hover:bg-forest-soft disabled:opacity-60">{busy ? "Saving..." : "Save changes"}</button>
        {note && <p role="status" className={`text-sm ${note.ok ? "text-emerald-800" : "text-red-700"}`}>{note.text}</p>}
      </div>
    </form>
  );
}

type NewHome = {
  name: string;
  locationId: number | null;
  propertyType: PropertyType;
  area: string | null;
  tagline: string;
  summary: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  nightlyPrice: number;
  weekendPrice: number;
  compareAtPrice: number | null;
  minNights: number;
  coverPhoto: string;
  isActive: boolean;
};

function NewHomeForm({ locations, onCreated, onCancel }: { locations: Location[]; onCreated: () => void; onCancel: () => void }) {
  const [d, setD] = useState<NewHome>({
    name: "",
    locationId: locations[0]?.id ?? null,
    propertyType: "apartment",
    area: "",
    tagline: "",
    summary: "",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    nightlyPrice: 5000,
    weekendPrice: 5000,
    compareAtPrice: null,
    minNights: 1,
    coverPhoto: "",
    isActive: true,
  });
  const [photosText, setPhotosText] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof NewHome>(k: K, v: NewHome[K]) => setD((x) => ({ ...x, [k]: v }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const highlights = highlightsText.split("\n").map((s) => s.trim()).filter(Boolean);
      await api("/admin/homes", { method: "POST", body: JSON.stringify({ ...d, area: d.area?.trim() || undefined, photos: textToPhotos(photosText), highlights }) });
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={create} className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest/30 sm:p-6">
      <h2 className="text-lg font-semibold text-forest">Add a home</h2>
      <p className="mt-1 text-sm text-muted">It starts with the standard amenity list. Add the map pin and Airbnb calendar link afterwards, in the home's card below.</p>
      {!locations.length && <p className="mt-3 text-sm text-red-700">Add a location first (Locations in the menu).</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlaceFields draft={d} set={(k, v) => set(k, v as never)} locations={locations} />
        <Field text="Tagline" className="sm:col-span-2 lg:col-span-4"><input required minLength={3} maxLength={200} value={d.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="For example, A cosy cottage with orchard views" className={input} /></Field>
        <Field text="Summary" className="sm:col-span-2 lg:col-span-4"><textarea required minLength={10} rows={3} maxLength={2000} value={d.summary} onChange={(e) => set("summary", e.target.value)} className={input} /></Field>
        <Field text="Maximum guests"><input type="number" min={1} max={20} required value={d.maxGuests} onChange={(e) => set("maxGuests", Number(e.target.value))} className={input} /></Field>
        <Field text="Bedrooms"><input type="number" min={0} max={20} required value={d.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} className={input} /></Field>
        <Field text="Bathrooms"><input type="number" min={0} max={20} required value={d.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} className={input} /></Field>
        <Field text="Minimum nights"><input type="number" min={1} max={30} required value={d.minNights} onChange={(e) => set("minNights", Number(e.target.value))} className={input} /></Field>
        <Field text="Weeknight price (₹)"><input type="number" min={0} required value={d.nightlyPrice} onChange={(e) => set("nightlyPrice", Number(e.target.value))} className={input} /></Field>
        <Field text="Friday and Saturday (₹)"><input type="number" min={0} required value={d.weekendPrice} onChange={(e) => set("weekendPrice", Number(e.target.value))} className={input} /></Field>
        <Field text="Was price (₹, optional)"><input type="number" min={0} value={d.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", num(e.target.value))} className={input} /></Field>
        <label className="flex min-h-11 items-end gap-2 pb-2 text-sm font-medium text-forest">
          <input type="checkbox" checked={d.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-forest" /> Show on website now
        </label>
        <Field text="Cover photo address (shown on cards)" className="sm:col-span-2 lg:col-span-4"><input type="url" required value={d.coverPhoto} onChange={(e) => set("coverPhoto", e.target.value)} placeholder="https://www.flexigoholidays.com/assets/img/..." className={input} /></Field>
        <Field text="More photos (one per line: image address | description)" className="sm:col-span-2 lg:col-span-4">
          <textarea rows={4} value={photosText} onChange={(e) => setPhotosText(e.target.value)} className={`${input} font-mono text-sm`} />
        </Field>
        <Field text="Highlights (one per line, up to 8)" className="sm:col-span-2 lg:col-span-4">
          <textarea rows={3} value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} placeholder={"Private balcony with valley views\nFully equipped kitchen"} className={input} />
        </Field>
      </div>
      {d.coverPhoto && <img src={d.coverPhoto} alt="" className="mt-4 h-28 w-40 rounded-xl object-cover" />}
      <ErrorNote message={error} />
      <div className="mt-5 flex flex-wrap gap-3">
        <button disabled={busy || !locations.length} className="min-h-11 rounded-[10px] bg-forest px-6 font-semibold text-white hover:bg-forest-soft disabled:opacity-60">{busy ? "Adding..." : "Add home"}</button>
        <button type="button" onClick={onCancel} className="min-h-11 rounded-[10px] px-4 text-sm font-semibold text-forest hover:bg-stone">Cancel</button>
      </div>
    </form>
  );
}

export function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api<Home[]>("/admin/homes"), api<Location[]>("/admin/locations")])
      .then(([h, l]) => {
        setHomes(h);
        setLocations(l);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <PageTitle title="Homes and prices" />
      <ErrorNote message={error} />
      {done && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{done}</p>}
      {adding ? (
        <NewHomeForm
          locations={locations}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setDone("Home added. It appears on the website within 10 minutes.");
            load();
          }}
        />
      ) : (
        <button onClick={() => { setAdding(true); setDone(null); }} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-soft">
          <Plus size={18} aria-hidden /> Add a home
        </button>
      )}
      <div className="grid gap-5">
        {homes.map((h) => (
          <HomeEditor key={h.id} home={h} locations={locations} onSaved={(s) => setHomes((hs) => hs.map((x) => (x.id === s.id ? s : x)))} />
        ))}
      </div>
    </>
  );
}
