"use client";
import { useEffect, useId, useRef, useState } from "react";

export interface Option { value: string; label: string; hint?: string }

interface Props {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown when nothing is selected; also the accessible label. */
  placeholder: string;
  /** Submit as a form field via a hidden input. */
  name?: string;
  /** "field" = full-width form control, "pill" = compact filter chip. */
  variant?: "field" | "pill";
  className?: string;
}

/** Accessible custom listbox (replaces native <select>). Keyboard: ↑ ↓ Home End Enter Esc, type-ahead. */
export function Select({ options, value, defaultValue = "", onChange, placeholder, name, variant = "field", className = "" }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Popup is position:fixed so it never gets clipped by a scrolling filter bar
  const [pos, setPos] = useState<React.CSSProperties>({});
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = options.find((o) => o.value === current);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    addEventListener("resize", dismiss);
    addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", close); removeEventListener("resize", dismiss); removeEventListener("scroll", close, true); };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openList = () => {
    const r = root.current!.getBoundingClientRect();
    const rtl = getComputedStyle(root.current!).direction === "rtl";
    const below = innerHeight - r.bottom > 300 || r.top < 300;
    setPos({
      position: "fixed",
      ...(below ? { top: r.bottom + 6 } : { bottom: innerHeight - r.top + 6 }),
      ...(rtl ? { right: Math.max(8, innerWidth - r.right) } : { left: Math.max(8, Math.min(r.left, innerWidth - 232)) }),
      minWidth: variant === "field" ? r.width : 224,
      maxWidth: "calc(100vw - 16px)",
    });
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };
  const choose = (v: string) => { setInner(v); setOpen(false); onChange?.(v); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(options[active].value); }
    else if (e.key === "Escape" || e.key === "Tab") setOpen(false);
    else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  };

  const isSet = current !== "";
  const trigger =
    variant === "pill"
      ? `h-10 rounded-full px-4 text-sm font-medium ${isSet ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink hover:border-ink/40"}`
      : `h-11 w-full rounded-lg px-3 text-base ${open ? "border-primary ring-4 ring-primary/15" : "border-line hover:border-ink/30"} bg-surface`;

  return (
    <div ref={root} className={`relative ${variant === "field" ? "w-full" : "shrink-0"} ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-label={placeholder}
        onClick={() => (open ? setOpen(false) : openList())} onKeyDown={onKey}
        className={`flex items-center justify-between gap-2 border text-start outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 ${trigger}`}
      >
        <span className={`truncate ${!isSet && variant === "field" ? "text-muted" : ""}`}>{selected && isSet ? selected.label : placeholder}</span>
        <svg viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${isSet && variant === "pill" ? "" : "text-muted"}`} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden><path d="m4 6 4 4 4-4" /></svg>
      </button>

      {open && (
        <ul
          ref={list} id={id} role="listbox" aria-label={placeholder} tabIndex={-1}
          style={pos}
          className="animate-pop z-50 max-h-72 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)]"
        >
          {options.map((o, i) => {
            const sel = o.value === current;
            return (
              <li
                key={o.value} data-i={i} role="option" aria-selected={sel}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-sm ${i === active ? "bg-surface-2" : ""} ${sel ? "font-semibold text-primary" : ""}`}
              >
                <span>{o.label}</span>
                <span className="flex items-center gap-2">
                  {o.hint && <span className="text-xs font-normal text-muted" dir="ltr">{o.hint}</span>}
                  {sel && <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="m3.5 8.5 3 3 6-7" /></svg>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
