import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog, getJobView } from "@/lib/catalog";
import { PRERENDER_LIMIT, SITE_URL, breadcrumbs, jsonLd as toJsonLd, orSample, pageMeta, snippet } from "@/lib/seo";
import { formatSalary, salaryConverted, timeAgo } from "@/lib/format";
import { JobBadges, JobCard, jobPlace } from "@/components/job-card";
import { JobAnalysisView } from "@/components/job-analysis";
import { analyzeJob } from "@/lib/job-analysis";
import { Logo } from "@/components/ui";
import { SaveButton } from "@/components/client";
import { ApplyButton } from "@/components/account";
import { BackIcon, ShareIcon, ShieldIcon } from "@/components/icons";

// Allowed to block: checking the job before Suspense is what lets an expired job return a real 404.
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]/jobs/[id]">): Promise<Metadata> {
  const { lang, id } = await props.params;
  const job = (await getJobView(id))?.job;
  if (!job) return {};
  return pageMeta(lang, `/jobs/${job.id}`, `${job.title} at ${job.company} — ${job.city ?? "Remote"}`, snippet(job.description));
}

export async function generateStaticParams() {
  const { jobs } = await getCatalog();
  return orSample(jobs.slice(0, PRERENDER_LIMIT).map((j) => ({ id: j.id })), { id: "sample" });
}

export default async function JobPage(props: PageProps<"/[lang]/jobs/[id]">) {
  const { id } = await props.params;
  // Before Suspense: once streaming starts, the response can no longer become a real 404.
  if (!(await getJobView(id))) notFound();
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse px-4 py-6" />}>
      <JobContent params={props.params} />
    </Suspense>
  );
}

async function JobContent({ params }: Pick<PageProps<"/[lang]/jobs/[id]">, "params">) {
  const { lang: l, id } = await params;
  const lang = l as Locale;
  const d = getDict(lang);
  const view = await getJobView(id);
  if (!view?.company) notFound();
  const { job, company, similar, companyJobCount, now } = view;
  const conv = job.salary && salaryConverted(job.salary);
  const shareText = encodeURIComponent(`${job.title} at ${job.company} — ${job.city ?? "Remote"}`);

  // Google needs a country to show a job as a rich result, so jobs open worldwide get no markup.
  const countryName = job.country && job.country !== "REMOTE" ? getDict("en").country[job.country] : null;
  const jsonLd = countryName && {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: job.title, description: job.description, datePosted: job.postedAt,
    validThrough: new Date(new Date(job.postedAt).getTime() + 60 * 864e5).toISOString(),
    url: `${SITE_URL}/en/jobs/${job.id}`,
    directApply: false,
    hiringOrganization: { "@type": "Organization", name: job.company, sameAs: company.careersUrl, ...(company.logo && { logo: company.logo }) },
    ...(job.mode === "remote"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: countryName } }
      : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", ...(job.city && { addressLocality: job.city }), addressCountry: job.country } } }),
    ...(job.salary && { baseSalary: { "@type": "MonetaryAmount", currency: job.salary.currency, value: { "@type": "QuantitativeValue", minValue: job.salary.min, maxValue: job.salary.max, unitText: job.salary.period === "month" ? "MONTH" : "YEAR" } } }),
  };

  const { years } = analyzeJob(job.description, job.tags);
  const facts: [string, string][] = [
    [d.jobFacts.location, jobPlace(job, d)], [d.jobFacts.mode, d.mode[job.mode]], [d.jobFacts.level, d.level[job.seniority]],
    [d.jobFacts.experience, job.experience ?? (years ? d.jobAnalysis.years.replace("{n}", years) : "—")], [d.jobFacts.field, d.category[job.category]], [d.jobFacts.posted, timeAgo(job.postedAt, new Date(now), d)],
  ];

  const ApplyBlock = (
    <div className="space-y-3">
      <ApplyButton href={job.applyUrl} label={d.applyJob} lang={lang} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary" />
      <div className="[&>button]:w-full"><SaveButton id={job.id} label={d.save} savedLabel={d.saved} /></div>
      <p className="flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
        <span><span className="inline-block first-letter:uppercase">{d.source}</span>: <span className="font-medium capitalize text-ink">{job.source}</span></span>
        <span>{timeAgo(job.postedAt, new Date(now), d)}</span>
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbs([[d.nav.jobs, `/${lang}/jobs`], [job.title, `/${lang}/jobs/${job.id}`]])) }} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Link href={`/${lang}/jobs`} className="inline-flex h-11 items-center gap-1 text-sm text-primary"><BackIcon />{d.nav.jobs}</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-3">
            <Logo company={company} size={48} />
            <Link href={`/${lang}/companies/${company.slug}`} className="font-medium hover:text-primary">{company.name}</Link>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight md:text-[32px]"><bdi>{job.title}</bdi></h1>
          {job.salary && (
            <p className="mt-3 text-xl font-semibold"><bdi>{formatSalary(job.salary, d)}</bdi> {conv && <span className="text-base font-normal text-muted"><bdi>{conv}</bdi></span>}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5"><JobBadges job={job} d={d} now={now} /></div>

          <dl className="mt-5 grid grid-cols-2 gap-3 card p-4 sm:grid-cols-3">
            {facts.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 text-sm font-medium" dir="auto">{v}</dd></div>)}
          </dl>

          <div className="mt-5 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <ShieldIcon className="h-5 w-5 shrink-0" /><p>{d.scamWarn}</p>
          </div>

          <JobAnalysisView job={job} d={d} />

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <ShareIcon className="h-4 w-4 text-muted" /><span className="text-muted">{d.share}:</span>
            <a className="rounded-lg border border-line px-3 py-2 hover:border-primary" target="_blank" rel="noopener" href={`https://wa.me/?text=${shareText}`}>WhatsApp</a>
            <a className="rounded-lg border border-line px-3 py-2 hover:border-primary" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${SITE_URL}/en/jobs/${job.id}`}>LinkedIn</a>
            <a className="rounded-lg border border-line px-3 py-2 hover:border-primary" target="_blank" rel="noopener" href={`https://t.me/share/url?url=${SITE_URL}/en/jobs/${job.id}&text=${shareText}`}>Telegram</a>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="hidden card p-4 lg:block">{ApplyBlock}</div>
          <div className="card p-4">
            <h2 className="font-semibold">{d.aboutCompany}</h2>
            {/* Companies created by the job sync have no about or industry yet */}
            {company.about && <p className="mt-2 text-sm leading-relaxed text-muted" dir="auto">{company.about}</p>}
            <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
              {company.industry && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">{d.industry}</dt><dd className="text-end font-medium">{company.industry}</dd></div>}
              {company.hq && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">{d.hq}</dt><dd className="text-end font-medium">{company.hq}</dd></div>}
            </dl>
            <Link href={`/${lang}/companies/${company.slug}`} className="mt-1 flex min-h-11 items-center text-sm font-medium text-primary hover:underline">{d.viewAllJobs.replace("{n}", String(companyJobCount))}</Link>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">{d.similar}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">{similar.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} now={now} />)}</div>
        </section>
      )}

      {/* Sticky apply bar on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-surface p-3 lg:hidden">
        <SaveButton id={job.id} label={d.save} savedLabel={d.saved} />
        <ApplyButton href={job.applyUrl} label={d.applyJob} lang={lang} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary" />
      </div>
    </div>
  );
}
