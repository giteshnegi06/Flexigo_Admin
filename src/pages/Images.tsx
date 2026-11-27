import { useEffect, useState } from "react";
import { api, type SiteImage } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

// Every website photo that is not a home photo (hero, "a day here", seasons, collection panels).
// Home photos are part of each home. The website picks up changes within 10 minutes.
const sections: Record<string, string> = { hero: "Hero", day: "A day here", season: "When to come", collection: "Collection panels" };

function ImageEditor({ image, hosts, onSaved }: { image: SiteImage; hosts: string[]; onSaved: (i: SiteImage) => void }) {
  const [url, setUrl] = useState(image.url);
  const [alt, setAlt] = useState(image.alt);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const changed = url !== image.url || alt !== image.alt;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const saved = await api<SiteImage>(`/admin/images/${image.key}`, { method: "PATCH", body: JSON.stringify({ url: url.trim(), alt: alt.trim() }) });
      onSaved(saved);
      setNote({ ok: true, text: "Saved. The website updates within 10 minutes." });
    } catch (err) {
      setNote({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-forest";
  return (
    <form onSubmit={save} className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:grid-cols-[11rem_1fr] sm:p-5">
      <img src={url} alt="" className="aspect-[4/3] w-full rounded-xl bg-stone object-cover" />
      <div className="min-w-0">
        <p className="font-semibold text-forest">{image.label}</p>
        <label className="mt-2 block text-sm font-medium text-forest">
          Image address
          <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} className={input} />
        </label>
        <label className="mt-3 block text-sm font-medium text-forest">
          Description (read aloud to blind visitors and used by Google)
          <input required minLength={3} maxLength={200} value={alt} onChange={(e) => setAlt(e.target.value)} className={input} />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button disabled={busy || !changed} className="min-h-11 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-soft disabled:opacity-50">{busy ? "Saving..." : "Save"}</button>
          {note && <p role="status" className={`text-sm ${note.ok ? "text-emerald-800" : "text-red-700"}`}>{note.text}</p>}
          {!note && <p className="text-xs text-muted">Images must be on {hosts.join(" or ")}.</p>}
        </div>
      </div>
    </form>
  );
}

export function ImagesPage() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ images: SiteImage[]; allowedHosts: string[] }>("/admin/images")
      .then((r) => {
        setImages(r.images);
        setHosts(r.allowedHosts);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <PageTitle title="Website images" />
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted">All website photos come from here and from each home's photos. Paste a new image address to change one; the preview updates as you type.</p>
      <ErrorNote message={error} />
      {Object.entries(sections).map(([key, title]) => {
        const list = images.filter((i) => i.section === key);
        if (!list.length) return null;
        return (
          <section key={key} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-forest">{title}</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {list.map((img) => (
                <ImageEditor key={img.key} image={img} hosts={hosts} onSaved={(s) => setImages((all) => all.map((x) => (x.key === s.key ? s : x)))} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
