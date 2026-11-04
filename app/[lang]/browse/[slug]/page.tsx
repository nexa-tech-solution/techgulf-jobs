import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, type Dict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import { buildLandings, cityArabic, isIndexable, topCounts, type Landing } from "@/lib/landing";
import { breadcrumbs, jsonLd, orSample, pageMeta } from "@/lib/seo";
import { JobCard } from "@/components/job-card";
import { Tag } from "@/components/ui";
import type { City } from "@/lib/types";

// Allowed to block: the check before Suspense is what returns a real 404.
export const instant = false;

const MAX_JOBS = 30;

function labels(page: Landing, d: Dict, lang: Locale, cities: City[]) {
  const what = page.what.kind === "skill" ? page.what.skill : d.category[page.what.category];
  const where = page.where.kind === "country" ? d.country[page.where.country]
    : lang === "ar" ? cityArabic(cities, page.where.city) : page.where.city;
  return { what, where };
}

export async function generateMetadata(props: PageProps<"/[lang]/browse/[slug]">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const { jobs, cities } = await getCatalog();
  const page = buildLandings(jobs).find((p) => p.slug === slug);
  if (!page) return {};
  const d = getDict(lang as Locale);
  const { what, where } = labels(page, d, lang as Locale, cities);
  const fill = (s: string) => s.replace("{what}", what).replace("{where}", where).replace("{n}", String(page.jobs.length));
  return pageMeta(lang, `/browse/${slug}`, fill(d.landing.title), fill(d.landing.desc), !isIndexable(page));
}

export async function generateStaticParams() {
  const { jobs } = await getCatalog();
  return orSample(buildLandings(jobs).filter(isIndexable).map((p) => ({ slug: p.slug })), { slug: "sample" });
}

export default async function BrowsePage(props: PageProps<"/[lang]/browse/[slug]">) {
  const { slug } = await props.params;
  // Before Suspense: once streaming starts, the response can no longer become a real 404.
  const { jobs } = await getCatalog();
  if (!buildLandings(jobs).some((p) => p.slug === slug)) notFound();
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
  const { jobs, cities, companies, now } = await getCatalog();
  const all = buildLandings(jobs);
  const page = all.find((p) => p.slug === slug);
  if (!page) notFound();
  const { what, where } = labels(page, d, lang, cities);
  const newest = [...page.jobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  const hiring = topCounts(page.jobs.map((j) => j.companySlug), 6);
  const skills = topCounts(page.jobs.flatMap((j) => j.tags), 8).filter(([s]) => s !== what);
  const sameKind = (p: Landing) => JSON.stringify(p.where) === JSON.stringify(page.where) || JSON.stringify(p.what) === JSON.stringify(page.what);
  const related = all.filter((p) => p.slug !== slug && isIndexable(p) && sameKind(p)).slice(0, 8);

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs([[d.nav.jobs, `/${lang}/jobs`], [t.heading.replace("{what}", what).replace("{where}", where), `/${lang}/browse/${slug}`]])) }} />
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-[28px] font-bold tracking-tight md:text-[40px]">{t.heading.replace("{what}", what).replace("{where}", where)}</h1>
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
              <div className="mt-2 flex flex-wrap gap-1.5">{skills.map(([s]) => <Tag key={s}>{s}</Tag>)}</div>
            </section>
          )}
          {related.length > 0 && (
            <section className="card p-4">
              <h2 className="font-semibold">{t.related}</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {related.map((p) => {
                  const r = labels(p, d, lang, cities);
                  return <li key={p.slug}><Link href={`/${lang}/browse/${p.slug}`} className="hover:text-primary">{t.heading.replace("{what}", r.what).replace("{where}", r.where)}</Link></li>;
                })}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
