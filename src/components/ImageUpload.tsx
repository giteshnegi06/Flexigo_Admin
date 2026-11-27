import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { imgSrc, uploadImage } from "../lib/api";

// Photo pickers for the admin forms. Photos are shrunk in the browser, uploaded to the database, and the form
// keeps their path ("/api/media/<id>"). An image address can still be pasted instead.

const btn = "inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold";

function useDrop(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(false);
        const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
        if (files.length) onFiles(files);
      },
    },
  };
}

/** One photo: a preview, an upload button (or drag a photo onto it), and an optional pasted address. */
export function ImageUpload({ value, onChange, label, aspect = "aspect-[4/3]", required = false }: { value: string; onChange: (url: string) => void; label: string; aspect?: string; required?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState(false);

  async function take(files: File[]) {
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(files[0]));
      setPaste(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const drop = useDrop(take);

  return (
    <div>
      <p className="text-sm font-medium text-forest">{label}{required && <span className="text-red-700"> *</span>}</p>
      <div className="mt-1.5 flex flex-wrap items-start gap-4">
        <button type="button" onClick={() => input.current?.click()} {...drop.props} aria-label={value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`} className={`relative w-48 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed ${aspect} ${drop.over ? "border-forest bg-forest/5" : value ? "border-transparent" : "border-line bg-stone hover:border-forest/40"}`}>
          {value ? <img src={imgSrc(value)} alt="" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-muted"><span className="flex flex-col items-center gap-1 text-sm"><ImagePlus size={26} aria-hidden /> Upload photo</span></span>}
          {busy && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-forest" size={26} aria-hidden /></span>}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${btn} bg-forest text-white hover:bg-forest-soft disabled:opacity-60`}>
            <Upload size={16} aria-hidden /> {value ? "Replace photo" : "Upload photo"}
          </button>
          <p className="text-xs text-muted">JPG, PNG, WebP or AVIF. Large photos are made smaller automatically. You can also drag a photo onto the box.</p>
          {paste ? (
            <input type="url" value={value.startsWith("/api/media/") ? "" : value} onChange={(e) => onChange(e.target.value.trim())} placeholder="https://images.unsplash.com/photo-..." className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-forest" />
          ) : (
            <button type="button" onClick={() => setPaste(true)} className="text-xs font-semibold text-forest underline underline-offset-2">Or paste an image address</button>
          )}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.length && take([...e.target.files])} onClick={(e) => ((e.target as HTMLInputElement).value = "")} />
    </div>
  );
}

export type Photo = { url: string; alt: string };

/** A home's photo gallery: upload several at once, describe each, change the order, set the cover, remove. */
export function PhotoManager({ photos, onChange, cover, onCover }: { photos: Photo[]; onChange: (p: Photo[]) => void; cover: string; onCover: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Several uploads finish one after another; each adds to the newest list, not the one from when it started.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);

  async function take(files: File[]) {
    setError(null);
    setBusy(files.length);
    const failed: string[] = [];
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        const next = [...latest.current, { url, alt: "" }];
        latest.current = next;
        onChange(next);
        if (!cover) onCover(url);
      } catch (err) {
        failed.push((err as Error).message);
      }
      setBusy((n) => n - 1);
    }
    if (failed.length) setError(failed.join(" "));
  }
  const drop = useDrop(take);

  const move = (i: number, step: number) => {
    const next = [...photos];
    const [p] = next.splice(i, 1);
    next.splice(i + step, 0, p);
    onChange(next);
  };
  const small = "grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white disabled:opacity-40";

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.url + i} className="overflow-hidden rounded-2xl ring-1 ring-line">
            <div className="relative aspect-[4/3] bg-stone">
              <img src={imgSrc(p.url)} alt="" className="absolute inset-0 size-full object-cover" />
              {p.url === cover && <span className="absolute left-2 top-2 rounded-full bg-forest px-2 py-0.5 text-xs font-semibold text-white">Cover</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                <span className="flex gap-1.5">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} className={small}><ArrowLeft size={16} aria-hidden /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} later`} className={small}><ArrowRight size={16} aria-hidden /></button>
                </span>
                <span className="flex gap-1.5">
                  <button type="button" onClick={() => onCover(p.url)} disabled={p.url === cover} aria-label={`Use photo ${i + 1} as the cover`} title="Use as cover" className={small}><Star size={16} aria-hidden /></button>
                  <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`} className={`${small} hover:text-red-700`}><Trash2 size={16} aria-hidden /></button>
                </span>
              </div>
            </div>
            <input value={p.alt} onChange={(e) => onChange(photos.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} maxLength={200} placeholder="Describe it (e.g. Bedroom with valley view)" aria-label={`Description of photo ${i + 1}`} className="w-full border-t border-line px-3 py-2 text-sm outline-none focus:bg-stone" />
          </li>
        ))}
        <li>
          <button type="button" onClick={() => input.current?.click()} {...drop.props} className={`grid aspect-[4/3] w-full place-items-center rounded-2xl border-2 border-dashed text-sm text-muted ${drop.over ? "border-forest bg-forest/5" : "border-line bg-stone hover:border-forest/40"}`}>
            <span className="flex flex-col items-center gap-1">
              {busy ? <Loader2 className="animate-spin text-forest" size={24} aria-hidden /> : <ImagePlus size={24} aria-hidden />}
              {busy ? `Uploading ${busy}...` : "Add photos"}
            </span>
          </button>
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted">Choose several photos at once, or drag them onto "Add photos". The first photo opens the photo tour; the star sets the cover shown on cards.</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files?.length && take([...e.target.files])} onClick={(e) => ((e.target as HTMLInputElement).value = "")} />
    </div>
  );
}
