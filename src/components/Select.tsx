import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// The admin's dropdown, used instead of the browser's own <select> so it matches the other fields: a rounded
// field that opens a card of options with the chosen one ticked. It opens upwards when there is no room below.
// Keyboard: arrows (or Home/End) move, Enter or Space picks, Escape closes, typing a letter jumps to an option.
export type SelectOption<T extends string | number> = { value: T; label: string; hint?: string };

type Props<T extends string | number> = {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  required?: boolean;
  /** Keep the label for screen readers only, when the page already makes the field obvious. */
  hideLabel?: boolean;
  className?: string;
};

export function Select<T extends string | number>({ label, value, options, onChange, placeholder = "Choose...", required = false, hideLabel = false, className = "" }: Props<T>) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState({ up: false, max: 320 });
  const current = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(0, current));

  function show() {
    const r = wrap.current?.getBoundingClientRect();
    if (r) {
      const want = Math.min(320, options.length * 46 + 12);
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < want && above > below;
      setRoom({ up, max: Math.max(160, Math.min(320, up ? above : below)) });
    }
    setActive(Math.max(0, current));
    setOpen(true);
    box.current?.focus(); // keys must reach the list even when it was opened by a tap or click
  }
  const hide = () => setOpen(false);
  function pick(i: number) {
    onChange(options[i].value);
    hide();
    box.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  function onKey(e: React.KeyboardEvent) {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape") {
      e.stopPropagation(); // close the list, not the popup it sits in
      hide();
    } else if (e.key === "Tab") return hide();
    else if (e.key.length === 1) {
      const from = (active + 1) % options.length;
      const order = [...options.slice(from), ...options.slice(0, from)];
      const hit = order.find((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (hit) setActive(options.indexOf(hit));
      return;
    } else return;
    e.preventDefault();
  }

  const chosen = current >= 0 ? options[current] : null;
  return (
    <div ref={wrap} className={`relative ${className}`}>
      <span id={`${id}-label`} className={hideLabel ? "sr-only" : "block text-sm font-medium text-forest"}>
        {label}
        {required && <span className="text-red-700"> *</span>}
      </span>
      <div
        ref={box}
        role="combobox"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        aria-required={required}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKey}
        className={`${hideLabel ? "" : "mt-1 "}flex min-h-[2.875rem] w-full cursor-pointer select-none items-center gap-2 rounded-xl border bg-white px-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-forest/20 ${
          open ? "border-forest ring-2 ring-forest/10" : "border-line hover:border-forest/40"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${chosen ? "text-ink" : "text-muted"}`}>{chosen?.label ?? placeholder}</span>
        <ChevronDown size={18} aria-hidden className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          style={{ maxHeight: room.max }}
          className={`absolute inset-x-0 z-30 overflow-y-auto overscroll-contain rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-18px_rgb(22_32_27/0.45)] ring-1 ring-line ${room.up ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {options.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">Nothing to choose yet.</li>}
          {options.map((o, i) => {
            const selected = i === current;
            return (
              <li
                key={String(o.value)}
                id={`${id}-${i}`}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(i)}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 transition-colors ${i === active ? "bg-stone" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${selected ? "font-semibold text-forest" : "text-ink"}`}>{o.label}</span>
                  {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
                </span>
                {selected && <Check size={18} aria-hidden className="shrink-0 text-forest" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
