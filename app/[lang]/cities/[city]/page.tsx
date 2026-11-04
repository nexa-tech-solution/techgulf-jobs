import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog, getMarketData } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/format";
import { JobCard } from "@/components/job-card";

export async function generateMetadata(props: PageProps<"/[lang]/cities/[city]">): Promise<Metadata> {
  const { city } = await props.params;
  const c = (await getCatalog()).cities.find((x) => x.slug === city);
  return c ? { title: `IT jobs in ${c.name}` } : {};
}

export default function CityPage(props: PageProps<"/[lang]/cities/[city]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-6xl animate-pulse px-4 py-12" />}>
      <CityContent params={props.params} />
    </Suspense>
  );
}

async function CityContent({ params }: Pick<PageProps<"/[lang]/cities/[city]">, "params">) {
  const { lang: l, city } = await params;
  const lang = l as Locale;
  const d = getDict(lang);
  const [catalog, market] = await Promise.all([getCatalog(), getMarketData()]);
  const c = catalog.cities.find((x) => x.slug === city);
  if (!c) notFound();
  const name = lang === "ar" ? c.ar : c.name;
  const jobs = catalog.jobs.filter((j) => j.city === c.name);
  const bench = (market?.benchmarks ?? []).filter((b) => b.city === c.name);
  return (
    <>
      {/* City hero — swap gradient for a licensed skyline photo (AVIF/WebP) */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-sm font-medium text-muted">{d.country[c.country]}</p>
          <h1 className="text-[28px] font-bold md:text-[40px]">{d.cityJobs.replace("{city}", name)}</h1>
          <p className="mt-1 text-muted">{d.cityStats.replace("{n}", String(jobs.length))}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((cat) => jobs.some((j) => j.category === cat)).map((cat) => (
              <Link key={cat} href={`/${lang}/jobs?city=${encodeURIComponent(c.name)}&category=${cat}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-primary">{d.category[cat]}</Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-3">{jobs.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={catalog.now} />)}</div>
        {bench.length > 0 && (
          <aside className="card p-4 lg:self-start">
            <h2 className="font-semibold">{d.nav.salaries}</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {bench.map((b) => (
                <li key={b.role} className="flex justify-between gap-2"><span>{b.role}</span><span className="font-semibold" dir="ltr">{b.currency} {b.p50.toLocaleString("en-US")}</span></li>
              ))}
            </ul>
            <Link href={`/${lang}/salaries`} className="mt-3 inline-block text-sm font-medium text-primary">{d.seeAll}</Link>
          </aside>
        )}
      </div>
    </>
  );
}
