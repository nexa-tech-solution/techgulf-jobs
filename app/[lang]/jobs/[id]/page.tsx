import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import { formatSalary, salaryConverted, timeAgo } from "@/lib/format";
import { JobBadges, JobCard, jobPlace } from "@/components/job-card";
import { Logo, Tag } from "@/components/ui";
import { ReportButton, SaveButton } from "@/components/client";
import { BackIcon, ExternalIcon, ShareIcon, ShieldIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/[lang]/jobs/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const job = (await getCatalog()).jobs.find((j) => j.id === id);
  if (!job) return {};
  return { title: `${job.title} at ${job.company} — ${job.city ?? "Remote"}`, description: job.description.slice(0, 155) };
}

export default function JobPage(props: PageProps<"/[lang]/jobs/[id]">) {
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
  const { jobs, companies, now } = await getCatalog();
  const job = jobs.find((j) => j.id === id);
  const company = companies.find((c) => c.slug === job?.companySlug);
  if (!job || !company) notFound();
  const similar = jobs.filter((j) => j.id !== job.id && (j.category === job.category || j.country === job.country)).slice(0, 4);
  const conv = job.salary && salaryConverted(job.salary);
  const shareText = encodeURIComponent(`${job.title} at ${job.company} — ${job.city ?? "Remote"}`);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: job.title, description: job.description, datePosted: job.postedAt,
    validThrough: new Date(new Date(job.postedAt).getTime() + 60 * 864e5).toISOString(),
    hiringOrganization: { "@type": "Organization", name: job.company, sameAs: company.careersUrl },
    employmentType: "FULL_TIME",
    ...(job.mode === "remote"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: [{ "@type": "Country", name: "India" }, { "@type": "Country", name: "United Arab Emirates" }] }
      : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city, addressCountry: job.country } } }),
    ...(job.salary && { baseSalary: { "@type": "MonetaryAmount", currency: job.salary.currency, value: { "@type": "QuantitativeValue", minValue: job.salary.min, maxValue: job.salary.max, unitText: job.salary.period === "month" ? "MONTH" : "YEAR" } } }),
  };

  const facts: [string, string][] = [
    [d.jobFacts.location, jobPlace(job, d)], [d.jobFacts.mode, d.mode[job.mode]], [d.jobFacts.level, d.level[job.seniority]],
    [d.jobFacts.experience, job.experience ?? "—"], [d.jobFacts.field, d.category[job.category]], [d.jobFacts.posted, timeAgo(job.postedAt, new Date(now), d)],
  ];

  const ApplyBlock = (
    <div className="space-y-3">
      <a href={job.applyUrl} target="_blank" rel="noopener nofollow" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary">
        {d.applyOnSite} <ExternalIcon />
      </a>
      <div className="flex gap-2">
        <SaveButton id={job.id} label={d.save} savedLabel={d.saved} />
        <ReportButton t={d} />
      </div>
      <p className="text-xs text-muted">{d.source}: <span className="capitalize">{job.source}</span> · {timeAgo(job.postedAt, new Date(now), d)}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
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
          <div className="mt-3 flex flex-wrap gap-1.5">{job.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>

          <div className="mt-5 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <ShieldIcon className="h-5 w-5 shrink-0" /><p>{d.scamWarn}</p>
          </div>

          <section dir="ltr" lang="en" className="prose-job mt-6 whitespace-pre-line text-base">{job.description}</section>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <ShareIcon className="h-4 w-4 text-muted" /><span className="text-muted">{d.share}:</span>
            <a className="rounded-lg border border-line px-3 py-2 hover:border-primary" target="_blank" rel="noopener" href={`https://wa.me/?text=${shareText}`}>WhatsApp</a>
            <a className="rounded-lg border border-line px-3 py-2 hover:border-primary" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=https://techgulfjobs.com/en/jobs/${job.id}`}>LinkedIn</a>
            <a className="rounded-lg border border-line px-3 py-2 hover:border-primary" target="_blank" rel="noopener" href={`https://t.me/share/url?url=https://techgulfjobs.com/en/jobs/${job.id}&text=${shareText}`}>Telegram</a>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="hidden card p-4 lg:block">{ApplyBlock}</div>
          <div className="card p-4">
            <h2 className="font-semibold">{d.aboutCompany}</h2>
            <p className="mt-2 text-sm text-muted" dir="auto">{company.about}</p>
            <p className="mt-2 text-sm"><span className="text-muted">{d.industry}:</span> {company.industry}</p>
            <p className="text-sm"><span className="text-muted">{d.hq}:</span> {company.hq}</p>
            <Link href={`/${lang}/companies/${company.slug}`} className="mt-3 inline-block text-sm font-medium text-primary">{d.viewAllJobs.replace("{n}", String(jobs.filter((j) => j.companySlug === company.slug).length))}</Link>
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
        <a href={job.applyUrl} target="_blank" rel="noopener nofollow" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary">{d.applyOnSite} <ExternalIcon /></a>
      </div>
    </div>
  );
}
