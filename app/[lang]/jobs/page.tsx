import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { JOBS_PAGE_SIZE, type JobFilters } from "@/lib/jobs";
import { getCatalog } from "@/lib/catalog";
import type { Job } from "@/lib/types";
import { JobsBrowser } from "@/components/jobs-browser";

const pageOf = (v: string | string[] | undefined) => Math.max(1, Number.parseInt(String(v), 10) || 1);

export async function generateMetadata(props: PageProps<"/[lang]/jobs">): Promise<Metadata> {
  const { lang } = await props.params;
  const d = getDict(lang as Locale);
  const s = d.seo;
  const sp = await props.searchParams;
  const page = pageOf(sp.page);
  // Only plain pages of the full list are their own canonical; filtered views still point at /jobs.
  if (page === 1 || Object.keys(sp).length > 1) return pageMeta(lang, "/jobs", s.jobsTitle, s.jobsDesc);
  const { jobs } = await getCatalog();
  return pageMeta(lang, `/jobs?page=${page}`, `${s.jobsTitle} — ${d.pageN.replace("{n}", String(page))}`, s.jobsDesc, page > Math.ceil(jobs.length / JOBS_PAGE_SIZE));
}

export default async function JobsPage(props: PageProps<"/[lang]/jobs">) {
  const lang = (await props.params).lang as Locale;
  return (
    <Suspense fallback={<Skeleton />}>
      <Results lang={lang} searchParams={props.searchParams} />
    </Suspense>
  );
}

const count = <K extends "country" | "category">(jobs: Job[], key: K) =>
  jobs.reduce<Record<string, number>>((acc, j) => { const v = j[key]; if (v) acc[v] = (acc[v] ?? 0) + 1; return acc; }, {});

async function Results({ lang, searchParams }: { lang: Locale; searchParams: PageProps<"/[lang]/jobs">["searchParams"] }) {
  const { page, ...sp } = await searchParams;
  const f: JobFilters = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v),
  );
  const { jobs, now } = await getCatalog();
  return (
    <JobsBrowser key={pageOf(page)} page={pageOf(page)} d={getDict(lang)} lang={lang} jobs={jobs} now={now} initial={f}
      counts={{ country: count(jobs, "country"), category: count(jobs, "category") }} />
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
