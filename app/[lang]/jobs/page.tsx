import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { filterJobs, getAllJobs, type JobFilters } from "@/lib/jobs";
import { TODAY } from "@/lib/mock-data";
import { FilterPanel, SearchBar } from "@/components/filters";
import { JobCard } from "@/components/job-card";
import { BellIcon } from "@/components/icons";

export const metadata: Metadata = { title: "IT jobs" };

export default async function JobsPage(props: PageProps<"/[lang]/jobs">) {
  const lang = (await props.params).lang as Locale;
  return (
    <Suspense fallback={<Skeleton />}>
      <Results lang={lang} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Results({ lang, searchParams }: { lang: Locale; searchParams: PageProps<"/[lang]/jobs">["searchParams"] }) {
  const sp = await searchParams;
  const f: JobFilters = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v),
  );
  const d = getDict(lang);
  const jobs = filterJobs(await getAllJobs(), f, TODAY);
  const qs = (patch: Partial<JobFilters>) => `/${lang}/jobs?${new URLSearchParams({ ...f, ...patch } as Record<string, string>)}`;
  const sorts = [["", d.sortRelevance], ["date", d.sortDate], ["salary", d.sortSalary]] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <SearchBar d={d} f={f} lang={lang} />
      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start"><FilterPanel d={d} f={f} lang={lang} /></aside>
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{d.results.replace("{n}", String(jobs.length))}</p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted">{d.sortBy}:</span>
              {sorts.map(([v, label]) => (
                <Link key={v} href={qs({ sort: v })} className={`rounded-lg px-2 py-1.5 ${(f.sort ?? "") === v ? "bg-primary/10 font-semibold text-primary" : "text-muted hover:text-ink"}`}>{label}</Link>
              ))}
            </div>
          </div>
          <div className="grid gap-3">{jobs.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} />)}</div>
          {jobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
              <p className="font-semibold">{d.noResults}</p>
              <p className="mt-1 text-sm text-muted">{d.noResultsHint}</p>
              <Link href={`/${lang}/alerts?q=${encodeURIComponent(f.q ?? "")}`} className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-on-primary"><BellIcon />{d.createAlert}</Link>
            </div>
          )}
          {jobs.length > 0 && (
            <Link href={`/${lang}/alerts?q=${encodeURIComponent(f.q ?? "")}&country=${f.country ?? ""}&category=${f.category ?? ""}`} className="mt-4 flex items-center justify-center gap-2 card p-4 text-sm font-medium text-primary hover:border-primary">
              <BellIcon /> {d.alertCta.button}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />)}
    </div>
  );
}
