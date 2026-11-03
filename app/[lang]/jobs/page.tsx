import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getDict, type Dict, type Locale } from "@/lib/i18n";
import { filterJobs, getAllJobs, type JobFilters } from "@/lib/jobs";
import { JOBS, TODAY } from "@/lib/mock-data";
import { SearchBar } from "@/components/filters";
import { FilterBar, SortSelect } from "@/components/filter-bar";
import { JobCard } from "@/components/job-card";
import { ShieldIcon } from "@/components/icons";
import { SaveSearch } from "@/components/account";

export const metadata: Metadata = { title: "IT jobs" };

export default async function JobsPage(props: PageProps<"/[lang]/jobs">) {
  const lang = (await props.params).lang as Locale;
  return (
    <Suspense fallback={<Skeleton />}>
      <Results lang={lang} searchParams={props.searchParams} />
    </Suspense>
  );
}

const count = <K extends "country" | "category">(key: K) =>
  JOBS.reduce<Record<string, number>>((acc, j) => { const v = j[key]; if (v) acc[v] = (acc[v] ?? 0) + 1; return acc; }, {});

async function Results({ lang, searchParams }: { lang: Locale; searchParams: PageProps<"/[lang]/jobs">["searchParams"] }) {
  const sp = await searchParams;
  const f: JobFilters = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v),
  );
  const d = getDict(lang);
  const jobs = filterJobs(await getAllJobs(), f, TODAY);
  const chips = activeChips(f, d);
  const without = (keys: string[]) => {
    const qs = new URLSearchParams(Object.entries(f).filter(([k]) => !keys.includes(k)) as [string, string][]);
    return `/${lang}/jobs${qs.size ? `?${qs}` : ""}`;
  };

  return (
    <>
      <div className="sticky top-16 z-20 border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-4">
          <SearchBar d={d} f={f} lang={lang} />
          <FilterBar d={d} f={f} lang={lang} counts={{ country: count("country"), category: count("category") }} />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">
                {d.results.replace("{n}", String(jobs.length))}
                {f.q && <span className="font-normal text-muted"> · “<bdi>{f.q}</bdi>”</span>}
              </h1>
              {chips.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {chips.map(([keys, label]) => (
                    <Link key={keys.join()} href={without(keys)} scroll={false} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 ps-3 pe-2 text-xs font-medium ring-1 ring-line hover:ring-ink/30" aria-label={`Remove ${label}`}>
                      {label}<span className="grid h-4 w-4 place-items-center rounded-full text-muted" aria-hidden>×</span>
                    </Link>
                  ))}
                  <Link href={`/${lang}/jobs`} className="ms-1 text-xs font-medium text-primary hover:underline">{d.clear}</Link>
                </div>
              )}
            </div>
            <SortSelect d={d} f={f} lang={lang} />
          </div>

          {jobs.length > 0 ? (
            <div className="grid gap-3">{jobs.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} />)}</div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
              <p className="font-semibold">{d.noResults}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{d.noResultsHint}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Link href={`/${lang}/jobs`} className="inline-flex h-11 items-center rounded-lg border border-line px-4 text-sm font-medium hover:border-ink/30">{d.clear}</Link>
                <SaveSearch d={d} lang={lang} f={f} variant="button" />
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[13.5rem] lg:self-start">
          <SaveSearch d={d} lang={lang} f={f} />
          <div className="flex gap-3 rounded-xl border border-line bg-surface p-5 text-sm text-muted">
            <ShieldIcon className="h-5 w-5 shrink-0 text-danger" /><p>{d.scamWarn}</p>
          </div>
          <Link href={`/${lang}/salaries`} className="block rounded-xl border border-line bg-surface p-5 hover:border-ink/30">
            <p className="font-semibold">{d.nav.salaries}</p>
            <p className="mt-1 text-sm text-muted">{d.salariesSub}</p>
          </Link>
        </aside>
      </div>
    </>
  );
}

function activeChips(f: JobFilters, d: Dict): [string[], string][] {
  const out: [string[], string][] = [];
  if (f.country) out.push([["country", "city"], d.country[f.country as keyof Dict["country"]] ?? f.country]);
  if (f.city) out.push([["city"], f.city]);
  if (f.category) out.push([["category"], d.category[f.category as keyof Dict["category"]] ?? f.category]);
  if (f.mode) out.push([["mode"], d.mode[f.mode as keyof Dict["mode"]] ?? f.mode]);
  if (f.seniority) out.push([["seniority"], d.level[f.seniority as keyof Dict["level"]] ?? f.seniority]);
  if (f.posted) out.push([["posted"], d.last.replace("{n}", f.posted)]);
  if (f.visa) out.push([["visa"], d.visa]);
  if (f.salary) out.push([["salary"], d.salaryDisclosed]);
  if (f.direct) out.push([["direct"], d.direct]);
  if (f.nationals) out.push([["nationals"], d.nationals]);
  return out;
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
      <div className="h-28 animate-pulse rounded-xl bg-surface" />
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />)}
    </div>
  );
}
