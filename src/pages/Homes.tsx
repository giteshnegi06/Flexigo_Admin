import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus } from "lucide-react";
import { api, imgSrc, inr, type Home, type Location, type PropertyType } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";
import { FormSection, Modal } from "../components/Modal";
import { ImageUpload, PhotoManager, type Photo } from "../components/ImageUpload";

// Homes and prices: a list of homes; "Add a home" and "Edit" open the same full form in a popup.

type Draft = {
  name: string;
  locationId: number | null;
  propertyType: PropertyType;
  area: string;
  isActive: boolean;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  minNights: number;
  nightlyPrice: number;
  weekendPrice: number;
  compareAtPrice: number | null;
  tagline: string;
  summary: string;
  highlights: string;
  coverPhoto: string;
  photos: Photo[];
  pin: string;
  mapExact: boolean;
  icalUrl: string;
  wifiMbps: number | null;
};

const input = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-forest";
const num = (v: string) => (v === "" ? null : Number(v));

// Reads "31.0676, 77.1828" or a Google Maps link that contains the point (…/@31.0676,77.1828,… or ?q=31.0676,77.1828).
function parsePin(text: string): { lat: number; lng: number } | null {
  const m = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

function toDraft(h: Home | null, locations: Location[]): Draft {
  if (!h) {
    return {
      name: "", locationId: locations[0]?.id ?? null, propertyType: "apartment", area: "", isActive: true,
      maxGuests: 4, bedrooms: 2, bathrooms: 2, minNights: 1, nightlyPrice: 5000, weekendPrice: 5000, compareAtPrice: null,
      tagline: "", summary: "", highlights: "", coverPhoto: "", photos: [], pin: "", mapExact: false, icalUrl: "", wifiMbps: null,
    };
  }
  return {
    name: h.name, locationId: h.locationId, propertyType: h.propertyType, area: h.area ?? "", isActive: h.isActive,
    maxGuests: h.maxGuests, bedrooms: h.bedrooms, bathrooms: h.bathrooms, minNights: h.minNights,
    nightlyPrice: h.nightlyPrice, weekendPrice: h.weekendPrice, compareAtPrice: h.compareAtPrice,
    tagline: h.tagline, summary: h.summary, highlights: (h.highlights ?? []).join("\n"), coverPhoto: h.coverPhoto, photos: h.photos,
    pin: h.mapLat != null && h.mapLng != null ? `${h.mapLat}, ${h.mapLng}` : "", mapExact: h.mapExact, icalUrl: h.icalUrl ?? "", wifiMbps: h.wifiMbps,
  };
}

function Field({ text, className = "", children }: { text: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-medium text-forest ${className}`}>
      {text}
      {children}
    </label>
  );
}

function HomeFormModal({ home, locations, onClose, onSaved }: { home: Home | null; locations: Location[]; onClose: () => void; onSaved: (message: string) => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(home, locations));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const pin = parsePin(d.pin);
  const formId = "home-form";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!d.coverPhoto) return setError("Add a cover photo: upload one, or use the star on a gallery photo.");
    if (!d.locationId) return setError("Choose a location. Add one on the Locations page first if the list is empty.");
    if (d.pin && !pin) return setError("The map pin is not a point. Paste coordinates like 31.0676, 77.1828, or leave it empty.");
    setBusy(true);
    setError(null);
    const highlights = d.highlights.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8);
    const photos = d.photos.map((p) => ({ url: p.url, alt: p.alt.trim() || undefined }));
    const body = {
      name: d.name.trim(), locationId: d.locationId, propertyType: d.propertyType, isActive: d.isActive,
      maxGuests: d.maxGuests, bedrooms: d.bedrooms, bathrooms: d.bathrooms, minNights: d.minNights,
      nightlyPrice: d.nightlyPrice, weekendPrice: d.weekendPrice, compareAtPrice: d.compareAtPrice,
      tagline: d.tagline.trim(), summary: d.summary.trim(), highlights, coverPhoto: d.coverPhoto,
      mapLat: pin?.lat ?? null, mapLng: pin?.lng ?? null, mapExact: pin ? d.mapExact : false,
      icalUrl: d.icalUrl.trim() || null, wifiMbps: d.wifiMbps,
    };
    try {
      if (home) {
        await api(`/admin/homes/${home.id}`, { method: "PUT", body: JSON.stringify({ ...body, area: d.area.trim() || null }) });
        await api(`/admin/homes/${home.id}/photos`, { method: "PUT", body: JSON.stringify({ photos }) });
        onSaved(`${body.name} saved. The website updates within 10 minutes.`);
      } else {
        await api("/admin/homes", { method: "POST", body: JSON.stringify({ ...body, area: d.area.trim() || undefined, photos }) });
        onSaved(`${body.name} added. It appears on the website within 10 minutes.`);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={home ? `Edit ${home.name}` : "Add a home"}
      subtitle={home ? `/homes/${home.slug}` : "Fill in the details guests see on the website. Fields marked * are needed."}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <button form={formId} disabled={busy} className="min-h-11 rounded-[10px] bg-forest px-6 font-semibold text-white hover:bg-forest-soft disabled:opacity-60">{busy ? "Saving..." : home ? "Save changes" : "Add home"}</button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-[10px] px-4 text-sm font-semibold text-forest hover:bg-stone">Cancel</button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      }
    >
      <form id={formId} onSubmit={save}>
        <FormSection title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field text="Home name *" className="sm:col-span-2"><input required minLength={2} maxLength={120} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="For example, Pine Cottage" className={input} /></Field>
            <Field text="Location *">
              <select required value={d.locationId ?? ""} onChange={(e) => set("locationId", num(e.target.value))} className={input}>
                <option value="" disabled>Choose a location</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
            <Field text="Type *">
              <select value={d.propertyType} onChange={(e) => set("propertyType", e.target.value as PropertyType)} className={input}>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
              </select>
            </Field>
            <Field text="Area (optional)"><input maxLength={80} value={d.area} onChange={(e) => set("area", e.target.value)} placeholder="For example, Panthaghati" className={input} /></Field>
            <label className="flex min-h-11 items-end gap-2 pb-2 text-sm font-medium text-forest">
              <input type="checkbox" checked={d.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-forest" /> Shown on website
            </label>
          </div>
        </FormSection>

        <FormSection title="Guests and rooms">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field text="Maximum guests *"><input type="number" min={1} max={20} required value={d.maxGuests} onChange={(e) => set("maxGuests", Number(e.target.value))} className={input} /></Field>
            <Field text="Bedrooms *"><input type="number" min={0} max={20} required value={d.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} className={input} /></Field>
            <Field text="Bathrooms *"><input type="number" min={0} max={20} required value={d.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} className={input} /></Field>
            <Field text="Minimum nights *"><input type="number" min={1} max={30} required value={d.minNights} onChange={(e) => set("minNights", Number(e.target.value))} className={input} /></Field>
          </div>
        </FormSection>

        <FormSection title="Prices" hint="For the whole home, per night, before taxes.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field text="Weeknight (₹) *"><input type="number" min={0} required value={d.nightlyPrice} onChange={(e) => set("nightlyPrice", Number(e.target.value))} className={input} /></Field>
            <Field text="Friday and Saturday (₹) *"><input type="number" min={0} required value={d.weekendPrice} onChange={(e) => set("weekendPrice", Number(e.target.value))} className={input} /></Field>
            <Field text="Was price (₹, optional)"><input type="number" min={0} value={d.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", num(e.target.value))} className={input} /></Field>
          </div>
        </FormSection>

        <FormSection title="Description">
          <div className="grid gap-4">
            <Field text="Tagline *"><input required minLength={3} maxLength={200} value={d.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="For example, A cosy cottage with orchard views" className={input} /></Field>
            <Field text="Summary *"><textarea required minLength={10} rows={3} maxLength={2000} value={d.summary} onChange={(e) => set("summary", e.target.value)} className={input} /></Field>
            <Field text="Highlights (one per line, up to 8)"><textarea rows={4} value={d.highlights} onChange={(e) => set("highlights", e.target.value)} placeholder={"Private balcony with valley views\nFully equipped kitchen"} className={input} /></Field>
          </div>
        </FormSection>

        <FormSection title="Photos" hint="The cover is shown on cards and search results. The gallery is the photo tour on the home's page.">
          <ImageUpload label="Cover photo" required value={d.coverPhoto} onChange={(url) => set("coverPhoto", url)} />
          <p className="mb-2 mt-6 text-sm font-medium text-forest">Gallery</p>
          <PhotoManager photos={d.photos} onChange={(p) => set("photos", p)} cover={d.coverPhoto} onCover={(url) => set("coverPhoto", url)} />
        </FormSection>

        <FormSection title="Location on the map" hint="Shown in the Location section of the home's page. Leave empty to hide the map.">
          <Field text="Google Maps link or coordinates"><input value={d.pin} onChange={(e) => set("pin", e.target.value)} placeholder="31.0676, 77.1828 or a Google Maps link" className={input} /></Field>
          <p className={`mt-1 text-xs ${d.pin && !pin ? "text-red-700" : "text-muted"}`}>
            {d.pin && !pin ? "Could not find a point in that. In Google Maps, right-click the building and click the numbers at the top to copy them." : pin ? (
              <>
                <MapPin size={12} className="inline" aria-hidden /> {pin.lat}, {pin.lng}.{" "}
                <a href={`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline">Check it on Google Maps</a>
              </>
            ) : "In Google Maps, right-click the building and click the numbers at the top to copy them."}
          </p>
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm font-medium text-forest">
            <input type="checkbox" checked={d.mapExact} disabled={!pin} onChange={(e) => set("mapExact", e.target.checked)} className="size-5 accent-forest" />
            This is the exact building (shows "Get directions"). Leave off to show the area only.
          </label>
        </FormSection>

        <FormSection title="Calendar and Wi-Fi">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field text="Airbnb calendar link (iCal)" className="sm:col-span-2"><input type="url" value={d.icalUrl} onChange={(e) => set("icalUrl", e.target.value)} placeholder="https://www.airbnb.co.in/calendar/ical/..." className={input} /></Field>
            <Field text="Wi-Fi speed (Mbps)"><input type="number" min={0} value={d.wifiMbps ?? ""} onChange={(e) => set("wifiMbps", num(e.target.value))} className={input} /></Field>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}

export function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ home: Home | null } | null>(null);
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
  const place = (h: Home) => [h.area, locations.find((l) => l.id === h.locationId)?.name].filter(Boolean).join(", ") || "No location";

  return (
    <>
      <PageTitle title="Homes and prices" />
      <ErrorNote message={error} />
      {done && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{done}</p>}
      <button onClick={() => { setOpen({ home: null }); setDone(null); }} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-soft">
        <Plus size={18} aria-hidden /> Add a home
      </button>
      <ul className="grid gap-3">
        {homes.map((h) => (
          <li key={h.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
            <img src={imgSrc(h.coverPhoto)} alt="" className="h-16 w-24 rounded-xl bg-stone object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-forest">
                {h.name} {!h.isActive && <span className="ml-1 rounded-full bg-stone px-2 py-0.5 text-xs font-medium text-muted">Hidden</span>}
              </p>
              <p className="text-sm text-muted">{place(h)} · <span className="capitalize">{h.propertyType}</span> · {h.maxGuests} guests · {h.bedrooms} bedrooms</p>
              <p className="text-sm text-forest">{inr(h.nightlyPrice)} a night · {h.photos.length} photos</p>
            </div>
            <button onClick={() => { setOpen({ home: h }); setDone(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold text-forest ring-1 ring-line hover:bg-stone">
              <Pencil size={16} aria-hidden /> Edit
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <HomeFormModal
          key={open.home?.id ?? "new"}
          home={open.home}
          locations={locations}
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
