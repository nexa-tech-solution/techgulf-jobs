import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import { orSample, pageMeta, snippet } from "@/lib/seo";
import { JobCard } from "@/components/job-card";
import { Logo } from "@/components/ui";
import { ExternalIcon } from "@/components/icons";

// Allowed to block: the check before Suspense is what returns a real 404.
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]/companies/[slug]">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const { jobs, companies } = await getCatalog();
  const c = companies.find((x) => x.slug === slug);
  if (!c) return {};
  const s = getDict(lang as Locale).seo;
  const n = jobs.filter((j) => j.companySlug === slug).length;
  // A company with no open jobs is a thin page: reachable, but kept out of search.
  return pageMeta(lang, `/companies/${slug}`, s.companyTitle.replace("{name}", c.name).replace("{n}", String(n)), snippet(s.companyDesc.replace("{name}", c.name).replace("{about}", c.about ?? "")), n === 0);
}

export async function generateStaticParams() {
  const { companies } = await getCatalog();
  return orSample(companies.map((c) => ({ slug: c.slug })), { slug: "sample" });
}

export default async function CompanyPage(props: PageProps<"/[lang]/companies/[slug]">) {
  const { slug } = await props.params;
  // Before Suspense: once streaming starts, the response can no longer become a real 404.
  if (!(await getCatalog()).companies.some((c) => c.slug === slug)) notFound();
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyContent params={props.params} />
    </Suspense>
  );
}

function CompanySkeleton() {
  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-surface" />
          <div className="mt-4 h-32 max-w-2xl animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 md:grid-cols-2">
        <div className="h-32 animate-pulse rounded-2xl bg-surface" />
        <div className="h-32 animate-pulse rounded-2xl bg-surface" />
      </div>
    </>
  );
}

async function CompanyContent({ params }: Pick<PageProps<"/[lang]/companies/[slug]">, "params">) {
  const { lang: l, slug } = await params;
  const lang = l as Locale;
  const d = getDict(lang);
  const catalog = await getCatalog();
  const c = catalog.companies.find((x) => x.slug === slug);
  if (!c) notFound();
  const jobs = catalog.jobs.filter((j) => j.companySlug === slug);
  const facts: [string, string][] = [[d.industry, c.industry], [d.hq, c.hq], [d.employees, c.size], [d.ats, c.ats]].filter(([, v]) => v) as [string, string][];
  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-center gap-4">
            <Logo company={c} size={64} />
            <div>
              <h1 className="text-2xl font-bold md:text-[32px]">{c.name}</h1>
              <p className="text-muted">{d.openJobs.replace("{n}", String(jobs.length))}</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl" dir="auto">{c.about}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {facts.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>)}
          </dl>
          <a href={c.careersUrl} target="_blank" rel="noopener" className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:border-primary">{d.careers} <ExternalIcon /></a>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 md:grid-cols-2">
        {jobs.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={catalog.now} />)}
      </div>
    </>
  );
}
