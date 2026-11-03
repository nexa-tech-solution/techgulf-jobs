import Link from "next/link";
import type { Job } from "@/lib/types";
import type { Dict, Locale } from "@/lib/i18n";
import { COMPANIES, TODAY } from "@/lib/mock-data";
import { formatSalary, isStale, salaryConverted, timeAgo } from "@/lib/format";
import { Badge, Logo, Tag } from "./ui";
import { SaveButton } from "./client";
import { PinIcon } from "./icons";

export function JobBadges({ job, d }: { job: Job; d: Dict }) {
  return (
    <>
      {job.featured && <Badge tone="accent">★ {d.badge.featured}</Badge>}
      {job.visaSponsored && <Badge tone="success">{d.badge.visa}</Badge>}
      {job.directEmployer ? <Badge tone="muted">{d.badge.direct}</Badge> : <Badge tone="warning">{d.badge.agency}</Badge>}
      {job.nationalsPreferred && <Badge tone="accent">{d.badge.nationals}</Badge>}
      {isStale(job.postedAt, TODAY) && <Badge tone="warning">{d.badge.stale}</Badge>}
    </>
  );
}

export function jobPlace(job: Job, d: Dict) {
  return [job.city, job.country && d.country[job.country]].filter(Boolean).join(", ");
}

export function JobCard({ job, d, lang }: { job: Job; d: Dict; lang: Locale }) {
  const company = COMPANIES.find((c) => c.slug === job.companySlug)!;
  const conv = job.salary && salaryConverted(job.salary);
  return (
    <article className={`card card-hover group relative p-4 md:p-5 ${job.featured ? "!border-accent/40" : ""}`}>
      <div className="flex items-start gap-3">
        <Logo company={company} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted">{job.company}</p>
          <h2 className="text-[17px] font-semibold leading-snug md:text-lg">
            <Link href={`/${lang}/jobs/${job.id}`} className="after:absolute after:inset-0 group-hover:text-primary">
              <bdi>{job.title}</bdi>
            </Link>
          </h2>
        </div>
        <SaveButton id={job.id} label={d.save} savedLabel={d.saved} compact />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><PinIcon className="h-4 w-4" />{jobPlace(job, d)}</span>
        {job.country !== "REMOTE" && <><span aria-hidden>·</span><span>{d.mode[job.mode]}</span></>}
        {job.experience && <><span aria-hidden>·</span><span dir="ltr">{job.experience}</span></>}
      </p>
      {job.salary && (
        <p className="mt-2 text-[15px] font-semibold text-ink">
          <bdi>{formatSalary(job.salary, d)}</bdi> {conv && <span className="text-sm font-normal text-muted"><bdi>{conv}</bdi></span>}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5"><JobBadges job={job} d={d} /></div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">{job.tags.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>)}</div>
        <p className="shrink-0 text-xs text-muted">{timeAgo(job.postedAt, TODAY, d)} · {d.source}: <span className="capitalize">{job.source}</span></p>
      </div>
    </article>
  );
}
