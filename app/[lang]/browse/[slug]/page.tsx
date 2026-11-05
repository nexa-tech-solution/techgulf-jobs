import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, type Dict, type Locale } from "@/lib/i18n";
import { getCatalog, getLandingView } from "@/lib/catalog";
import { buildLandings, isIndexable, landingLabels, topCounts } from "@/lib/landing";
import { PRERENDER_LIMIT, breadcrumbs, jsonLd, orSample, pageMeta } from "@/lib/seo";
import { JobCard } from "@/components/job-card";
import { Tag } from "@/components/ui";

// Allowed to block: the check before Suspense is what returns a real 404.
export const instant = false;

const MAX_JOBS = 30;

export async function generateMetadata(props: PageProps<"/[lang]/browse/[slug]">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const view = await getLandingView(slug);
  if (!view) return {};
  const { page, cities } = view;
  const d = getDict(lang as Locale);
  const { what, where, heading } = landingLabels(page, d, lang as Locale, cities);
  const desc = page.only === "visa" ? d.landing.descVisa : page.only === "salary" ? d.landing.descSalary : d.landing.desc;
  return pageMeta(lang, `/browse/${slug}`, heading, desc.replace("{what}", what).replace("{where}", where).replace("{n}", String(page.jobs.length)), !isIndexable(page));
}

export async function generateStaticParams() {
  const { jobs } = await getCatalog();
  return orSample(buildLandings(jobs).filter(isIndexable).slice(0, PRERENDER_LIMIT).map((p) => ({ slug: p.slug })), { slug: "sample" });
}

export default async function BrowsePage(props: PageProps<"/[lang]/browse/[slug]">) {
  const { slug } = await props.params;
  // Before Suspense: once streaming starts, the response can no longer become a real 404.
  if (!(await getLandingView(slug))) notFound();
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-6xl animate-pulse px-4 py-12" />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[lang]/browse/[slug]">, "params">) {
  const { lang: l, slug } = await params;
  const lang = l as Locale;
  const d = getDict(lang);
  const t = d.landing;
  const view = await getLandingView(slug);
  if (!view) notFound();
  const { page, related, skillPages, cities, companies, now } = view;
  const { what, heading } = landingLabels(page, d, lang, cities);
  const newest = [...page.jobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  const hiring = topCounts(page.jobs.map((j) => j.companySlug), 6);
  const skills = topCounts(page.jobs.flatMap((j) => j.tags), 8).filter(([s]) => s !== what);

  // Written from this page's own jobs, so it is accurate and differs from page to page.
  const week = page.jobs.filter((j) => new Date(now).getTime() - new Date(j.postedAt).getTime() < 7 * 864e5).length;
  const names = hiring.slice(0, 3).map(([s]) => companies.find((c) => c.slug === s)?.name ?? s).join(", ");
  const topLevel = topCounts(page.jobs.map((j) => j.seniority), 1)[0]?.[0] as keyof Dict["level"] | undefined;
  const intro = [
    names && t.introHiring.replace("{names}", names),
    topLevel && t.introLevel.replace("{level}", d.level[topLevel]),
    skills.length >= 2 && t.introSkills.replace("{skills}", skills.slice(0, 3).map(([s]) => s).join(", ")),
    week > 0 && t.introWeek.replace("{n}", String(week)),
  ].filter(Boolean).join(" ");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs([[d.nav.jobs, `/${lang}/jobs`], [heading, `/${lang}/browse/${slug}`]])) }} />
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-[28px] font-bold tracking-tight md:text-[40px]">{heading}</h1>
          <p className="mt-2 max-w-2xl text-muted">{t.sub.replace("{n}", String(page.jobs.length)).replace("{companies}", String(new Set(page.jobs.map((j) => j.companySlug)).size))}</p>
          {intro && <p className="mt-3 max-w-3xl text-[15px] leading-relaxed">{intro}</p>}
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="grid content-start gap-3">
          {newest.slice(0, MAX_JOBS).map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={now} />)}
        </div>
        <aside className="space-y-4 lg:self-start">
          <section className="card p-4">
            <h2 className="font-semibold">{t.hiring}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {hiring.map(([s, n]) => (
                <li key={s} className="flex justify-between gap-3">
                  <Link href={`/${lang}/companies/${s}`} className="hover:text-primary">{companies.find((c) => c.slug === s)?.name ?? s}</Link>
                  <span className="text-muted" dir="ltr">{n}</span>
                </li>
              ))}
            </ul>
          </section>
          {skills.length > 0 && (
            <section className="card p-4">
              <h2 className="font-semibold">{t.skills}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">{skills.map(([s]) => skillPages[s] ? <Link key={s} href={`/${lang}/browse/${skillPages[s]}`} className="hover:text-primary"><Tag>{s}</Tag></Link> : <Tag key={s}>{s}</Tag>)}</div>
            </section>
          )}
          {related.length > 0 && (
            <section className="card p-4">
              <h2 className="font-semibold">{t.related}</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {related.map((p) => <li key={p.slug}><Link href={`/${lang}/browse/${p.slug}`} className="hover:text-primary">{landingLabels(p, d, lang, cities).heading}</Link></li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
