import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, prettyDate, type BlockedNight, type Home } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";
import { Select } from "../components/Select";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const sourceStyle: Record<BlockedNight["source"], string> = {
  manual: "bg-pine-dark text-white",
  airbnb: "bg-rose-700 text-white",
  booking: "bg-forest text-white",
};

export function CalendarPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [homeId, setHomeId] = useState<number | null>(null);
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [blocked, setBlocked] = useState<BlockedNight[]>([]);
  const [range, setRange] = useState<{ from: string; to: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Home[]>("/admin/homes")
      .then((hs) => {
        setHomes(hs);
        setHomeId((id) => id ?? hs[0]?.id ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const days = new Date(month.y, month.m + 1, 0).getDate();
  const first = iso(month.y, month.m, 1);
  const last = iso(month.y, month.m, days);
  const offset = (new Date(month.y, month.m, 1).getDay() + 6) % 7; // weeks start on Monday

  const load = useCallback(() => {
    if (!homeId) return;
    api<BlockedNight[]>(`/admin/blocked-dates?homeId=${homeId}&from=${first}&to=${last}`).then(setBlocked).catch((e: Error) => setError(e.message));
  }, [homeId, first, last]);
  useEffect(load, [load]);

  const byNight = useMemo(() => new Map(blocked.map((b) => [b.night, b])), [blocked]);
  const inRange = (d: string) => range && (range.to ? d >= range.from && d <= range.to : d === range.from);

  function pick(d: string) {
    if (!range || range.to) setRange({ from: d, to: null });
    else setRange(d < range.from ? { from: d, to: range.from } : { from: range.from, to: d });
  }

  async function apply(action: "block" | "unblock") {
    if (!range || !homeId) return;
    setBusy(true);
    setError(null);
    try {
      await api("/admin/blocked-dates", { method: "POST", body: JSON.stringify({ homeId, from: range.from, to: range.to ?? range.from, action, note: action === "block" ? "Blocked in admin" : undefined }) });
      setRange(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const step = (d: number) => setMonth(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const title = new Date(month.y, month.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      <PageTitle title="Calendar">
        <Select
          label="Property"
          hideLabel
          className="w-full sm:w-64"
          value={homeId}
          onChange={(v) => {
            setHomeId(v);
            setRange(null);
          }}
          options={homes.map((h) => ({ value: h.id, label: h.name }))}
        />
      </PageTitle>
      <ErrorNote message={error} />
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => step(-1)} className="grid size-11 place-items-center rounded-full ring-1 ring-line" aria-label="Previous month"><ChevronLeft aria-hidden /></button>
          <h2 className="text-lg font-semibold text-forest">{title}</h2>
          <button onClick={() => step(1)} className="grid size-11 place-items-center rounded-full ring-1 ring-line" aria-label="Next month"><ChevronRight aria-hidden /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => <div key={"e" + i} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = iso(month.y, month.m, i + 1);
            const b = byNight.get(d);
            const sel = inRange(d);
            return (
              <button
                key={d}
                onClick={() => pick(d)}
                aria-pressed={!!sel}
                aria-label={`${prettyDate(d)}${b ? `, blocked (${b.source})` : ", free"}`}
                className={`aspect-square min-h-11 rounded-xl text-sm font-medium ${b ? sourceStyle[b.source] : "bg-stone/60 text-forest hover:bg-stone"} ${sel ? "ring-3 ring-forest ring-offset-1" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-pine-dark" /> Blocked by you</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-rose-700" /> Booked on Airbnb</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-forest" /> Direct booking</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <p className="flex-1 text-sm text-forest">
          {range ? <>Selected {prettyDate(range.from)}{range.to && range.to !== range.from ? ` to ${prettyDate(range.to)}` : ""}. {range.to ? "" : "Tap another night to select a range."}</> : "Tap a night, then another, to select the nights to block or free."}
        </p>
        <button disabled={!range || busy} onClick={() => apply("block")} className="min-h-11 rounded-[10px] bg-forest px-5 text-sm font-semibold text-white disabled:opacity-50">Block nights</button>
        <button disabled={!range || busy} onClick={() => apply("unblock")} className="min-h-11 rounded-[10px] bg-white px-5 text-sm font-semibold text-forest ring-1 ring-line hover:ring-forest disabled:opacity-50">Free nights</button>
      </div>
      <p className="mt-3 text-xs text-muted">Only nights you blocked here can be freed here. Airbnb and direct bookings are changed at their source.</p>
    </>
  );
}
