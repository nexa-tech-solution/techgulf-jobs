import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { CATEGORIES, formatSalary, timeAgo } from "@/lib/format";
import { getCatalog } from "@/lib/catalog";
import { SearchBar } from "@/components/filters";
import { JobCard } from "@/components/job-card";
import { Logo } from "@/components/ui";
import { ArrowIcon } from "@/components/icons";
import { UserMap } from "@/components/user-map";
import { buildLandings, isIndexable } from "@/lib/landing";
import { CountUp, DotField } from "@/components/effects";

export async function generateMetadata(props: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  const s = getDict(lang as Locale).seo;
  return pageMeta(lang, "", s.homeTitle, s.homeDesc);
}

export default async function Home(props: PageProps<"/[lang]">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const { jobs, companies, cities, now } = await getCatalog();
  const newest = [...jobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  const justPosted = newest.slice(0, 5);
  const featured = newest.filter((j) => j.featured);
  // The hero already lists the newest five, so this section continues from there.
  const latest = newest.filter((j) => !j.featured && !justPosted.includes(j)).slice(0, 6);
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const hiring = companies.filter((c) => c.ats !== "direct").slice(0, 16);
  const withSalary = jobs.length ? Math.round((jobs.filter((j) => j.salary).length / jobs.length) * 100) : 0;
  const stats = [
    { value: jobs.length, suffix: "", label: d.stats.jobs },
    { value: companies.length, suffix: "", label: d.stats.companies },
    ...(withSalary > 0 ? [{ value: withSalary, suffix: "%", label: d.stats.withSalary }] : []),
  ];
  const categories = CATEGORIES
    .map((c) => ({ key: c, count: jobs.filter((j) => j.category === c).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const topCities = cities
    .map((c) => ({ ...c, count: jobs.filter((j) => j.city === c.name).length }))
    .sort((a, b) => b.count - a.count);

  // Links from the home page are how Google first finds these pages. Gulf pages come first.
  const landings = buildLandings(jobs).filter(isIndexable);
  const isGulf = (p: (typeof landings)[number]) => p.where.country !== "IN";
  const popular = [...landings.filter(isGulf).slice(0, 8), ...landings.filter((p) => !isGulf(p)).slice(0, 8)];

  return (
    <>
      <section className="tech-glow border-b border-line bg-surface">
        <DotField />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:py-16 lg:grid-cols-[1fr_400px]">
          <div>
            <h1 className="max-w-2xl text-[34px] font-bold leading-[1.12] tracking-tight md:text-[48px]">{d.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-muted md:text-lg">{d.heroSub}</p>
            <div className="mt-8 max-w-2xl"><SearchBar d={d} f={{}} lang={lang} big /></div>
            <p className="mt-4 text-sm text-muted">
              {d.home.popular}{" "}
              {["React", "Python", "DevOps", "SAP FICO", "Flutter", "Data engineer"].map((s, i) => (
                <span key={s}>
                  {i > 0 && ", "}
                  <Link href={`/${lang}/jobs?q=${encodeURIComponent(s)}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-primary" dir="ltr">{s}</Link>
                </span>
              ))}
            </p>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="font-mono text-2xl font-medium tracking-tight" dir="ltr" style={{ textAlign: "start" }}><CountUp value={s.value} suffix={s.suffix} /></dd>
                  <dt className="text-sm text-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <p className="border-b border-line bg-surface-2 px-4 py-3 text-sm font-semibold">{d.home.postedRecently}</p>
            <ul>
              {justPosted.map((j) => {
                const c = companies.find((x) => x.slug === j.companySlug) ?? { name: j.company, color: "#64748b" };
                return (
                  <li key={j.id} className="border-b border-line last:border-0">
                    <Link href={`/${lang}/jobs/${j.id}`} className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                      <Logo company={c} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium"><bdi>{j.title}</bdi></p>
                        <p className="truncate text-xs text-muted">{j.company} · {j.city ?? d.country.REMOTE}{j.salary && <> · <bdi>{formatSalary(j.salary, d)}</bdi></>}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">{timeAgo(j.postedAt, new Date(now), d)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">{d.home.hiringNow}</span>
          <div className="marquee min-w-0 flex-1 overflow-hidden" dir="ltr">
            <div className="marquee-track flex w-max">
              {[false, true].map((copy) => (
                <ul key={String(copy)} aria-hidden={copy} className="marquee-copy flex shrink-0 items-center gap-8 pe-8">
                  {hiring.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/${lang}/companies/${c.slug}`} tabIndex={copy ? -1 : undefined} className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-muted transition-colors hover:text-ink">
                        <Logo company={c} size={22} />{c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <Section title={d.featuredJobs} href={`/${lang}/jobs`} more={d.seeAll}>
          <div className="grid gap-3 md:grid-cols-2">{featured.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={now} />)}</div>
        </Section>
      )}

      <Section title={d.latestJobs} href={`/${lang}/jobs?sort=date`} more={d.seeAll}>
        <div className="grid gap-3 md:grid-cols-2">{latest.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={now} />)}</div>
      </Section>

      <Section title={d.browseByField}>
        <div className="grid overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 1 }}>
          {categories.map((c) => (
            <Link key={c.key} href={`/${lang}/jobs?category=${c.key}`} className="flex items-center justify-between gap-3 bg-surface px-4 py-4 transition-colors hover:bg-surface-2">
              <span className="text-sm font-medium">{d.category[c.key]}</span>
              <span className="text-xs text-muted" dir="ltr">{fmt(c.count)}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={d.browseByCity}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topCities.map((c) => (
            <Link key={c.slug} href={`/${lang}/cities/${c.slug}`} className="card card-hover flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{lang === "ar" ? c.ar : c.name}</span>
                <span className="block truncate text-xs text-muted">{d.country[c.country]}</span>
              </span>
              {c.count > 0 && <span className="text-sm text-muted" dir="ltr">{fmt(c.count)}</span>}
            </Link>
          ))}
        </div>
      </Section>

      {popular.length > 0 && (
        <Section title={d.landing.popular}>
          <div className="flex flex-wrap gap-2">
            {popular.map((p) => {
              const what = p.what.kind === "skill" ? p.what.skill : d.category[p.what.category];
              const where = p.where.kind === "country" ? d.country[p.where.country] : p.where.city;
              return <Link key={p.slug} href={`/${lang}/browse/${p.slug}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-primary">{d.landing.heading.replace("{what}", what).replace("{where}", where)}</Link>;
            })}
          </div>
        </Section>
      )}

      <Section title={d.userMap.title} sub={d.userMap.sub}>
        <UserMap d={d} lang={lang} />
      </Section>

      <div className="h-14" aria-hidden />
    </>
  );
}

function Section({ title, sub, href, more, children }: { title: string; sub?: string; href?: string; more?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
          {sub && <p className="mt-1 text-muted">{sub}</p>}
        </div>
        {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{more} <ArrowIcon /></Link>}
      </div>
      {children}
    </section>
  );
}
