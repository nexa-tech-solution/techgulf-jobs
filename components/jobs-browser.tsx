"use client";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { filterJobs, type JobFilters } from "@/lib/jobs";
import { FilterBar, SortSelect, type Patch } from "./filter-bar";
import { JobCard } from "./job-card";
import { SaveSearch } from "./account";
import { SearchIcon, ShieldIcon } from "./icons";

const clean = (f: JobFilters): JobFilters => Object.fromEntries(Object.entries(f).filter(([, v]) => v)) as JobFilters;
const toQs = (f: JobFilters) => new URLSearchParams(Object.entries(clean(f)) as [string, string][]).toString();
const PAGE = 20;

/**
 * Filters run in the browser — instant, no server round-trip per click.
 * The URL is kept in sync (shareable, Back button works); first paint is still server-rendered for SEO.
 */
export function JobsBrowser({ d, lang, jobs, initial, counts, now }: {
  d: Dict; lang: Locale; jobs: Job[]; initial: JobFilters; now: string;
  counts: { country: Record<string, number>; category: Record<string, number> };
}) {
  const [f, setF] = useState<JobFilters>(initial);
  const [q, setQ] = useState(initial.q ?? "");
  const [limit, setLimit] = useState(PAGE);
  const deferred = useDeferredValue(f);
  const results = useMemo(() => filterJobs(jobs, deferred, new Date(now)), [jobs, deferred, now]);

  const go = (patch: Patch, mode: "push" | "replace" = "push") => {
    const next = clean({ ...f, ...patch });
    setF(next);
    setLimit(PAGE);
    const qs = toQs(next);
    history[mode === "push" ? "pushState" : "replaceState"](null, "", `/${lang}/jobs${qs ? `?${qs}` : ""}`);
  };

  // Back / Forward restore filters without reloading
  useEffect(() => {
    const onPop = () => {
      const next = Object.fromEntries(new URLSearchParams(location.search)) as JobFilters;
      setF(next);
      setQ(next.q ?? "");
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  // Search as you type (replace, so typing doesn't flood history)
  useEffect(() => {
    if ((f.q ?? "") === q) return;
    const t = setTimeout(() => go({ q }, "replace"), 180);
    return () => clearTimeout(t);
  });

  // The filter bar grows when its filters wrap, so the sidebar follows its real height.
  const bar = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bar.current) return;
    const observer = new ResizeObserver(([entry]) => {
      content.current?.style.setProperty("--filter-bar", `${entry.target.getBoundingClientRect().height}px`);
    });
    observer.observe(bar.current);
    return () => observer.disconnect();
  }, []);

  const chips: [Patch, string][] = [];
  if (f.country) chips.push([{ country: "", city: "" }, d.country[f.country as keyof Dict["country"]] ?? f.country]);
  if (f.city) chips.push([{ city: "" }, f.city]);
  if (f.category) chips.push([{ category: "" }, d.category[f.category as keyof Dict["category"]] ?? f.category]);
  if (f.mode) chips.push([{ mode: "" }, d.mode[f.mode as keyof Dict["mode"]] ?? f.mode]);
  if (f.seniority) chips.push([{ seniority: "" }, d.level[f.seniority as keyof Dict["level"]] ?? f.seniority]);
  if (f.posted) chips.push([{ posted: "" }, d.last.replace("{n}", f.posted)]);
  if (f.visa) chips.push([{ visa: "" }, d.visa]);
  if (f.salary) chips.push([{ salary: "" }, d.salaryDisclosed]);
  if (f.direct) chips.push([{ direct: "" }, d.direct]);
  if (f.nationals) chips.push([{ nationals: "" }, d.nationals]);
  const stale = deferred !== f;

  return (
    <>
      <div ref={bar} className="sticky top-16 z-20 border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-4">
          <form role="search" onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-muted" />
              <input name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.searchPlaceholder} aria-label={d.search}
                className="h-12 w-full rounded-lg border border-line bg-surface ps-10 pe-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
            </div>
            <button className="h-12 rounded-lg bg-primary px-6 font-semibold text-on-primary hover:opacity-90">{d.search}</button>
          </form>
          <FilterBar d={d} f={f} counts={counts} go={go} />
        </div>
      </div>

      <div ref={content} className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold" aria-live="polite">
                {d.results.replace("{n}", String(results.length))}
                {f.q && <span className="font-normal text-muted"> · “<bdi>{f.q}</bdi>”</span>}
              </h1>
              {chips.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {chips.map(([patch, label]) => (
                    <button key={label} type="button" onClick={() => go(patch)} aria-label={`Remove ${label}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 ps-3 pe-2 text-xs font-medium ring-1 ring-line transition hover:ring-ink/30">
                      {label}<span className="text-muted" aria-hidden>×</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => { setQ(""); go({ country: "", city: "", category: "", mode: "", seniority: "", posted: "", visa: "", salary: "", direct: "", nationals: "", q: "" }); }}
                    className="ms-1 text-xs font-medium text-primary hover:underline">{d.clear}</button>
                </div>
              )}
            </div>
            <SortSelect d={d} f={f} go={go} />
          </div>

          <div className={`transition-opacity duration-150 ${stale ? "opacity-70" : ""}`}>
            {results.length > 0 ? (
              <div className="grid gap-3">
                {results.slice(0, limit).map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={now} />)}
                {results.length > limit && (
                  <button type="button" onClick={() => setLimit(limit + PAGE)} className="h-11 rounded-lg border border-line bg-surface text-sm font-medium hover:border-ink/30">
                    {d.showMore.replace("{n}", String(results.length - limit))}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
                <p className="font-semibold">{d.noResults}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{d.noResultsHint}</p>
                <div className="mt-5 flex justify-center gap-2">
                  <Link href={`/${lang}/jobs`} onClick={() => { setQ(""); setF({}); }} className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-medium hover:border-ink/30">{d.clear}</Link>
                  <SaveSearch d={d} lang={lang} f={f} variant="button" />
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-line bg-surface p-5 text-sm text-muted">
            <ShieldIcon className="h-5 w-5 shrink-0 text-danger" /><p>{d.scamWarn}</p>
          </div>
          <Link href={`/${lang}/salaries`} className="block rounded-xl border border-line bg-surface p-5 hover:border-ink/30">
            <p className="font-semibold">{d.nav.salaries}</p>
            <p className="mt-1 text-sm text-muted">{d.salariesSub}</p>
          </Link>
          {/* Last, so it can stay pinned without covering the cards above it */}
          <div className="jobs-alert"><SaveSearch d={d} lang={lang} f={f} /></div>
        </aside>
      </div>
    </>
  );
}
