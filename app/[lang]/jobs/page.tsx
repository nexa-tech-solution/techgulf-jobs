import type { Metadata } from "next";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { getAllJobs, type JobFilters } from "@/lib/jobs";
import { JOBS } from "@/lib/mock-data";
import { JobsBrowser } from "@/components/jobs-browser";

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
  return (
    <JobsBrowser d={getDict(lang)} lang={lang} jobs={await getAllJobs()} initial={f}
      counts={{ country: count("country"), category: count("category") }} />
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
      <div className="h-28 animate-pulse rounded-xl bg-surface" />
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />)}
    </div>
  );
}
