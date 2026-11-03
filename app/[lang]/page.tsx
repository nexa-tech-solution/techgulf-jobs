import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { CITIES, COMPANIES, JOBS, TODAY } from "@/lib/mock-data";
import { CATEGORIES, formatSalary, timeAgo } from "@/lib/format";
import { getAllJobs } from "@/lib/jobs";
import { SearchBar } from "@/components/filters";
import { JobCard } from "@/components/job-card";
import { Logo } from "@/components/ui";
import { ArrowIcon } from "@/components/icons";

export default async function Home(props: PageProps<"/[lang]">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const jobs = await getAllJobs();
  const featured = jobs.filter((j) => j.featured);
  const newest = [...JOBS].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  const latest = newest.filter((j) => !j.featured).slice(0, 6);
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const hiring = COMPANIES.filter((c) => c.ats !== "direct").slice(0, 10);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:py-14 lg:grid-cols-[1fr_380px]">
          <div>
            <h1 className="max-w-2xl text-[32px] font-bold leading-[1.15] tracking-tight md:text-[46px]">{d.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-muted md:text-lg">{d.heroSub}</p>
            <div className="mt-7 max-w-2xl"><SearchBar d={d} f={{}} lang={lang} big /></div>
            <p className="mt-4 text-sm text-muted">
              {lang === "ar" ? "شائع:" : "Popular:"}{" "}
              {["React", "Python", "DevOps", "SAP FICO", "Flutter", "Data engineer"].map((s, i) => (
                <span key={s}>
                  {i > 0 && ", "}
                  <Link href={`/${lang}/jobs?q=${encodeURIComponent(s)}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-primary" dir="ltr">{s}</Link>
                </span>
              ))}
            </p>
            <p className="mt-8 text-sm text-muted" dir="auto">
              <span className="font-semibold text-ink">{fmt(JOBS.length * 1350)}</span> {d.stats.jobs} ·{" "}
              <span className="font-semibold text-ink">{fmt(COMPANIES.length * 85)}</span> {d.stats.companies} ·{" "}
              <span className="font-semibold text-ink">31%</span> {d.stats.withSalary}
            </p>
          </div>

          {/* Real content instead of decoration: what was posted today */}
          <div className="rounded-xl border border-line">
            <p className="border-b border-line px-4 py-3 text-sm font-semibold">{d.latestJobs}</p>
            <ul>
              {newest.slice(0, 5).map((j) => {
                const c = COMPANIES.find((x) => x.slug === j.companySlug)!;
                return (
                  <li key={j.id} className="border-b border-line last:border-0">
                    <Link href={`/${lang}/jobs/${j.id}`} className="flex gap-3 px-4 py-3 hover:bg-surface-2">
                      <Logo company={c} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium"><bdi>{j.title}</bdi></p>
                        <p className="truncate text-xs text-muted">{j.company} · {j.city ?? d.country.REMOTE}{j.salary && <> · <bdi>{formatSalary(j.salary, d)}</bdi></>}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">{timeAgo(j.postedAt, TODAY, d)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-5">
          <span className="text-xs font-medium text-muted">{lang === "ar" ? "يوظفون الآن" : "Hiring now"}</span>
          {hiring.map((c) => (
            <Link key={c.slug} href={`/${lang}/companies/${c.slug}`} className="text-sm font-semibold text-muted hover:text-ink">{c.name}</Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <Section title={d.featuredJobs} href={`/${lang}/jobs`} more={d.seeAll}>
          <div className="grid gap-3 md:grid-cols-2">{featured.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} />)}</div>
        </Section>
      )}

      <Section title={d.browseByField}>
        <div className="grid overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 1 }}>
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/${lang}/jobs?category=${c}`} className="flex items-center justify-between bg-surface px-4 py-4 hover:bg-surface-2">
              <span className="text-sm font-medium">{d.category[c]}</span>
              <span className="text-xs text-muted" dir="ltr">{fmt(JOBS.filter((j) => j.category === c).length * 1350)}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={d.browseByCity}>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Link key={c.slug} href={`/${lang}/cities/${c.slug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-ink/30">
              {lang === "ar" ? c.ar : c.name} <span className="text-muted">· {d.country[c.country]}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={d.latestJobs} href={`/${lang}/jobs?sort=date`} more={d.seeAll}>
        <div className="grid gap-3 md:grid-cols-2">{latest.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} />)}</div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-6 md:flex-row md:items-center md:p-8">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{d.alertCta.title}</h2>
            <p className="mt-1 text-muted">{d.alertCta.sub}</p>
          </div>
          <Link href={`/${lang}/alerts`} className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary hover:opacity-90">{d.alertCta.button}</Link>
        </div>
      </section>
    </>
  );
}

function Section({ title, href, more, children }: { title: string; href?: string; more?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
        {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{more} <ArrowIcon /></Link>}
      </div>
      {children}
    </section>
  );
}
