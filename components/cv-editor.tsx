"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Diagnostic } from "@codemirror/lint";
import { CvDocument } from "./cv-document";
import type { CvCodeEditorHandle } from "./cv-code-editor";
import { CV_MAX_LENGTH, CV_TEMPLATES, parseCv, setTemplate, type CvDiagnostic, type CvTemplate } from "@/lib/cv-latex";
import { CV_GUIDE_SNIPPETS } from "@/lib/cv-samples";
import { profileToSource, sampleSource } from "@/lib/cv-starter";
import type { Dict, Locale } from "@/lib/i18n";
import { actions, useStore } from "@/lib/store";

const CvCodeEditor = dynamic(() => import("./cv-code-editor").then((m) => m.CvCodeEditor), { ssr: false });

const GUIDE_SEEN = "tgj:cv-guide-seen";
const SAVE_DELAY = 1200;
const PAPER_WIDTH = 794; // A4 at 96 dpi
const ZOOM_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.5];

export function CvEditor({ d, lang }: { d: Dict; lang: Locale }) {
  const t = d.cvEditor;
  const { cv, profile, user } = useStore();
  // Holds text only while it is unsaved; otherwise the store is the source, so a newer copy from the account shows up by itself.
  const [draft, setDraft] = useState<string | null>(null);
  const source = draft ?? cv?.source ?? null;
  const [gallery, setGallery] = useState(false);
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [split, setSplit] = useState(50);
  const [zoom, setZoom] = useState<number | null>(null);
  const [fit, setFit] = useState(0.7);
  const [mounted, setMounted] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const [guide, setGuide] = useState(false);
  const editor = useRef<CvCodeEditorHandle>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  const doc = useMemo(() => (source === null ? null : parseCv(source)), [source]);
  const tooLong = (source?.length ?? 0) > CV_MAX_LENGTH;

  // Autosave after a pause in typing, and never lose the last edit when leaving the page.
  const pending = useRef<string | null>(null);
  const flush = useCallback(() => {
    if (pending.current !== null && pending.current.length <= CV_MAX_LENGTH) {
      actions.saveCv(pending.current);
      pending.current = null;
      setDraft(null);
    }
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const edit = useCallback((text: string) => {
    pending.current = text;
    setDraft(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  }, [flush]);
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); clearTimeout(timer.current); flush(); };
  }, [flush]);

  // The print copy is attached to <body>, which only exists in the browser.
  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setFit(Math.max(0.3, Math.min(1.5, (el.clientWidth - 48) / PAPER_WIDTH))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [source === null, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const message = useCallback((x: CvDiagnostic) => t.errors[x.code].replace("{x}", x.arg), [t]);
  const diagnostics = useMemo<Diagnostic[]>(
    () => (doc?.diagnostics ?? []).map((x) => ({ from: x.from, to: x.to, severity: "error", message: message(x) })),
    [doc, message],
  );

  const write = (next: string) => {
    clearTimeout(timer.current);
    pending.current = next;
    flush();
  };
  const generate = (template: CvTemplate) => (profile ? profileToSource(profile, template, lang, d, user?.email) : sampleSource(template, lang, d));
  const choose = (template: CvTemplate) => {
    // Opens by itself once, when someone creates their first CV.
    if (source === null) {
      try {
        if (!localStorage.getItem(GUIDE_SEEN)) { setGuide(true); localStorage.setItem(GUIDE_SEEN, "1"); }
      } catch { /* storage may be blocked */ }
    }
    write(source === null ? generate(template) : setTemplate(source, template));
    setGallery(false);
  };
  const startOver = () => {
    if (!doc || !window.confirm(t.resetConfirm)) return;
    write(generate(doc.template));
    setGallery(false);
  };

  const exportPdf = () => {
    flush();
    // Browsers use the page title as the suggested PDF file name.
    const title = document.title;
    const name = doc?.name.flatMap((n) => (n.t === "text" ? [n.v] : [])).join("").trim();
    document.title = name ? `${name} - CV` : "CV";
    window.addEventListener("afterprint", () => { document.title = title; }, { once: true });
    window.print();
  };

  const exportWord = async (kind: "docx" | "doc") => {
    if (!doc) return;
    flush();
    setExportFailed(false);
    try {
      const { cvFileName, saveBlob, toDocBlob, toDocxBlob } = await import("@/lib/cv-export");
      saveBlob(kind === "docx" ? await toDocxBlob(doc) : toDocBlob(doc), `${cvFileName(doc)}.${kind}`);
    } catch (error) {
      console.warn("CV export failed", error);
      setExportFailed(true);
    }
  };
  const exportDocx = () => exportWord("docx");
  const exportDoc = () => exportWord("doc");
  const closeMenu = (e: React.MouseEvent) => e.currentTarget.closest("details")?.removeAttribute("open");

  const insertSnippet = (text: string) => {
    // On phones the guide covers the code, so it closes to show what was added.
    if (window.innerWidth < 768) { setTab("code"); setGuide(false); }
    editor.current?.insert(`${text}\n`);
  };

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const box = splitRef.current?.getBoundingClientRect();
      if (box) setSplit(Math.max(25, Math.min(75, ((ev.clientX - box.left) / box.width) * 100)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const scale = zoom ?? fit;
  const stepZoom = (dir: 1 | -1) => {
    const next = dir > 0 ? ZOOM_STEPS.find((z) => z > scale + 0.001) : [...ZOOM_STEPS].reverse().find((z) => z < scale - 0.001);
    if (next) setZoom(next);
  };

  if (source === null || !doc || gallery) {
    return <Gallery d={d} lang={lang} current={doc?.template} hasProfile={!!profile} onChoose={choose} onClose={doc ? () => setGallery(false) : undefined} onReset={doc ? startOver : undefined} />;
  }

  const button = "inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium hover:border-primary";
  const menuItem = "flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-start text-sm font-medium hover:bg-surface-2";
  const errors = doc.diagnostics;

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[520px] flex-col bg-surface-2">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <h1 className="me-1 text-sm font-semibold">{t.title}</h1>
        <button type="button" onClick={() => setGallery(true)} className={button}>{t.templates}: {t.templateNames[doc.template]}</button>
        <button type="button" onClick={() => setGuide((open) => !open)} aria-expanded={guide} className={button}>{t.guide.open}</button>
        <span role="status" className={`text-xs ${tooLong || exportFailed ? "font-medium text-danger" : "text-muted"}`}>
          {exportFailed ? t.exportFailed : tooLong ? t.tooLong : draft !== null ? t.saving : user ? t.savedAccount : t.savedBrowser}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex" dir="ltr">
            <button type="button" onClick={() => stepZoom(-1)} aria-label={t.zoomOut} className={button}>−</button>
            <button type="button" onClick={() => setZoom(null)} title={t.zoomFit} className="h-9 w-14 text-center text-xs text-muted hover:text-ink">{Math.round(scale * 100)}%</button>
            <button type="button" onClick={() => stepZoom(1)} aria-label={t.zoomIn} className={button}>+</button>
          </div>
          <details data-menu className="relative">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:opacity-90">{t.download}</summary>
            <div className="card animate-pop absolute end-0 top-11 z-20 w-64 p-1 shadow-lg">
              <button type="button" onClick={(e) => { closeMenu(e); exportPdf(); }} title={t.pdfHint} className={menuItem}>{t.formatPdf}</button>
              <button type="button" onClick={(e) => { closeMenu(e); void exportDocx(); }} className={menuItem}>{t.formatDocx}</button>
              <button type="button" onClick={(e) => { closeMenu(e); void exportDoc(); }} className={menuItem}>{t.formatDoc}</button>
            </div>
          </details>
        </div>
      </div>

      <div className="flex border-b border-line bg-surface md:hidden" role="tablist">
        {(["code", "preview"] as const).map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`h-11 flex-1 text-sm font-medium ${tab === id ? "border-b-2 border-primary text-ink" : "text-muted"}`}>{t.tabs[id]}</button>
        ))}
      </div>

      {/* Code stays on the left in both languages, the way code editors do. */}
      <div ref={splitRef} dir="ltr" className="relative flex min-h-0 flex-1 cv-split" style={{ "--cv-split": `${split}%` } as React.CSSProperties}>
        <section className={`cv-pane-code min-h-0 min-w-0 flex-col bg-surface ${tab === "code" ? "flex" : "hidden md:flex"}`}>
          <div className="min-h-0 flex-1">
            <CvCodeEditor ref={editor} value={source} onChange={edit} diagnostics={diagnostics} label={t.tabs.code} />
          </div>
          {errors.length > 0 && (
            <div dir={lang === "ar" ? "rtl" : "ltr"} className="max-h-36 shrink-0 overflow-auto border-t border-line bg-surface-2 text-sm">
              <p className="sticky top-0 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-danger">{t.errorCount.replace("{n}", String(errors.length))}</p>
              <ul>
                {errors.slice(0, 50).map((x, i) => (
                  <li key={`${x.from}-${i}`}>
                    <button type="button" onClick={() => editor.current?.jumpTo(x.from)} className="flex w-full gap-2 px-3 py-1 text-start hover:bg-surface">
                      <span className="shrink-0 font-mono text-xs leading-5 text-muted" dir="ltr">{t.line} {source.slice(0, x.from).split("\n").length}</span>
                      <span className="min-w-0">{message(x)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div role="separator" aria-orientation="vertical" aria-label={t.resize} aria-valuenow={Math.round(split)} aria-valuemin={25} aria-valuemax={75} tabIndex={0}
          onPointerDown={startDrag}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSplit((s) => Math.max(25, s - 3));
            if (e.key === "ArrowRight") setSplit((s) => Math.min(75, s + 3));
          }}
          className="hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-line hover:bg-primary focus-visible:bg-primary md:block" />

        <section ref={previewRef} aria-label={t.tabs.preview} className={`min-h-0 min-w-0 flex-1 overflow-auto p-4 ${tab === "preview" ? "block" : "hidden md:block"}`}>
          <div className="mx-auto w-fit" style={{ zoom: scale }}>
            <div className="cv-paper cv-paper-screen"><CvDocument doc={doc} /></div>
          </div>
        </section>

        {guide && <GuidePanel d={d} lang={lang} onClose={() => setGuide(false)} onInsert={insertSnippet} />}
      </div>

      {mounted && createPortal(
        <div className="cv-print-root">
          {/* With no page margin, browsers have nowhere to print the page URL and date.
              The repeating table header and footer then give every page its margins. */}
          <style>{"@page { size: A4; margin: 0; }"}</style>
          <table className="cv-print-table" role="presentation">
            <thead><tr><td className="cv-print-gap" /></tr></thead>
            <tbody><tr><td><CvDocument doc={doc} /></td></tr></tbody>
            <tfoot><tr><td className="cv-print-gap" /></tr></tfoot>
          </table>
        </div>,
        document.body,
      )}
    </div>
  );
}

function GuidePanel({ d, lang, onClose, onInsert }: { d: Dict; lang: Locale; onClose: () => void; onInsert: (text: string) => void }) {
  const t = d.cvEditor.guide;
  const keys = Object.keys(CV_GUIDE_SNIPPETS) as (keyof typeof CV_GUIDE_SNIPPETS)[];
  return (
    <aside aria-label={t.title} dir={lang === "ar" ? "rtl" : "ltr"} className="absolute inset-0 z-20 overflow-auto border-l border-line bg-surface p-5 md:left-auto md:w-[380px] md:shadow-xl lg:static lg:w-[360px] lg:shrink-0 lg:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <button type="button" onClick={onClose} className="h-9 rounded-lg border border-line px-3 text-sm font-medium hover:border-primary">{t.close}</button>
      </div>
      <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm">{t.steps.map((step) => <li key={step}>{step}</li>)}</ol>

      <h3 className="mt-6 font-semibold">{t.commandsTitle}</h3>
      <p className="mt-1 text-sm text-muted">{t.commandsSub}</p>
      <ul className="mt-3 space-y-2">
        {keys.map((key) => (
          <li key={key}>
            <button type="button" onClick={() => onInsert(CV_GUIDE_SNIPPETS[key])} className="w-full rounded-lg border border-line p-3 text-start hover:border-primary">
              <span className="block text-sm font-medium">{t.commands[key]}</span>
              <code dir="ltr" className="mt-1 block whitespace-pre-wrap text-start font-mono text-xs text-muted">{CV_GUIDE_SNIPPETS[key]}</code>
            </button>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 font-semibold">{t.tipsTitle}</h3>
      <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm">{t.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
    </aside>
  );
}

function Gallery({ d, lang, current, hasProfile, onChoose, onClose, onReset }: {
  d: Dict; lang: Locale; current?: CvTemplate; hasProfile: boolean;
  onChoose: (template: CvTemplate) => void; onClose?: () => void; onReset?: () => void;
}) {
  const t = d.cvEditor;
  const previews = useMemo(
    () => CV_TEMPLATES.map((template) => ({ template, doc: parseCv(sampleSource(template, lang, d)) })),
    [d, lang],
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.galleryTitle}</h1>
          <p className="mt-1 max-w-2xl text-muted">{current ? t.gallerySwitch : hasProfile ? t.galleryFromProfile : t.gallerySample}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} className="h-11 rounded-lg border border-line px-4 text-sm font-semibold hover:border-primary">{t.backToEditor}</button>}
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {previews.map(({ template, doc }) => (
          <button key={template} type="button" onClick={() => onChoose(template)} aria-pressed={current === template}
            className={`card card-hover flex flex-col overflow-hidden text-start ${current === template ? "border-primary" : ""}`}>
            <span className="block h-80 overflow-hidden bg-surface-2 p-3" aria-hidden inert>
              <span className="mx-auto block w-fit" style={{ zoom: 0.4 }}><span className="cv-paper cv-paper-screen block"><CvDocument doc={doc} /></span></span>
            </span>
            <span className="block border-t border-line p-4">
              <span className="block font-semibold">{t.templateNames[template]}</span>
              <span className="mt-1 block text-sm text-muted">{t.templateDesc[template]}</span>
            </span>
          </button>
        ))}
      </div>
      {onReset && (
        <div className="mt-8 border-t border-line pt-5">
          <button type="button" onClick={onReset} className="text-sm font-medium text-danger hover:underline">{hasProfile ? t.resetProfile : t.resetSample}</button>
        </div>
      )}
    </div>
  );
}
