"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { BookmarkIcon, FlagIcon, SunMoonIcon } from "./icons";

export function SaveButton({ id, label, savedLabel, compact }: { id: string; label: string; savedLabel: string; compact?: boolean }) {
  const { jobs } = useStore();
  const on = !!jobs[id];
  return (
    <button
      type="button" onClick={() => actions.toggleSave(id)} aria-pressed={on}
      className={`relative z-10 inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg ${compact ? "px-2" : "border border-line px-4"} text-sm font-medium ${on ? "text-primary" : "text-muted hover:text-ink"}`}
    >
      <BookmarkIcon filled={on} />
      <span className={compact ? "sr-only" : ""}>{on ? savedLabel : label}</span>
    </button>
  );
}

export function LangSwitch({ label }: { label: string }) {
  const path = usePathname();
  const target = path.startsWith("/ar") ? "en" : "ar";
  return (
    <Link
      href={path.replace(/^\/(en|ar)/, `/${target}`)}
      onClick={() => { document.cookie = `lang=${target};path=/;max-age=31536000`; }}
      className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted hover:text-ink"
      lang={target} hrefLang={target}
    >
      {label}
    </Link>
  );
}

export function ThemeToggle({ label }: { label: string }) {
  return (
    <button
      type="button" aria-label={label} title={label}
      onClick={() => {
        const el = document.documentElement;
        const dark = el.dataset.theme ? el.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
        el.dataset.theme = dark ? "light" : "dark";
        try { localStorage.setItem("tgj:theme", el.dataset.theme); } catch { /* ignore */ }
      }}
      className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:text-ink"
    >
      <SunMoonIcon />
    </button>
  );
}

export function ReportButton({ t }: { t: { report: string; reportTitle: string; reportReasons: string[]; send: string; cancel: string; reportThanks: string } }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState(false);
  return (
    <>
      <button type="button" onClick={() => { setDone(false); ref.current?.showModal(); }} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-line px-4 text-sm font-medium text-muted hover:text-danger">
        <FlagIcon className="h-4 w-4" /> {t.report}
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,420px)] rounded-xl border border-line bg-surface p-0 text-ink backdrop:bg-black/50">
        {done ? (
          <div className="p-5">
            <p>{t.reportThanks}</p>
            <button onClick={() => ref.current?.close()} className="mt-4 h-11 rounded-lg bg-primary px-5 font-semibold text-on-primary">OK</button>
          </div>
        ) : (
          <form className="p-5" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <h2 className="text-lg font-semibold">{t.reportTitle}</h2>
            <div className="mt-3 space-y-1">
              {t.reportReasons.map((r, i) => (
                <label key={r} className="flex min-h-11 items-center gap-3"><input type="radio" name="reason" required defaultChecked={i === 0} className="h-4 w-4 accent-[var(--primary)]" />{r}</label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => ref.current?.close()} className="h-11 rounded-lg px-4 text-muted">{t.cancel}</button>
              <button className="h-11 rounded-lg bg-danger px-5 font-semibold text-white">{t.send}</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

/** Press "/" anywhere to focus the job search box (dev-tool convention). */
export function SearchHotkey() {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || t.closest("input, textarea, select, [contenteditable]")) return;
      const el = document.querySelector<HTMLInputElement>('input[name="q"]');
      if (el) { e.preventDefault(); el.focus(); }
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);
  return null;
}

/** Native <details> menus stay open by themselves. Closes them on an outside press, a choice inside, or Esc. */
export function CloseMenus() {
  useEffect(() => {
    const openMenus = () => [...document.querySelectorAll<HTMLDetailsElement>("details[data-menu][open]")];
    const onPress = (e: PointerEvent) => {
      openMenus().forEach((menu) => { if (!menu.contains(e.target as Node)) menu.open = false; });
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      // The summary toggles the menu itself; links and buttons inside are choices
      if (target.closest("summary")) return;
      if (target.closest("a, button")) openMenus().forEach((menu) => { if (menu.contains(target)) menu.open = false; });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") openMenus().forEach((menu) => { menu.open = false; });
    };
    document.addEventListener("pointerdown", onPress);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPress);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}
