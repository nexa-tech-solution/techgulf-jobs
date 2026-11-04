import type { Dict } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { analyzeJob } from "@/lib/job-analysis";
import { Tag } from "./ui";

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="card p-4 md:p-5">
      <h2 className="font-semibold">{title}</h2>
      {/* Items are quoted from the posting, which is in English */}
      <ul dir="ltr" lang="en" className="mt-3 space-y-2 text-[15px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function JobAnalysisView({ job, d }: { job: Job; d: Dict }) {
  const a = analyzeJob(job.description, job.tags);
  const t = d.jobAnalysis;
  const core = job.tags.filter((tag) => !a.optionalSkills.includes(tag));
  const facts: [string, string][] = [
    ...(a.years ? [[t.experience, t.years.replace("{n}", a.years)] as [string, string]] : []),
    ...(a.degree ? [[t.education, a.degree] as [string, string]] : []),
    ...(a.arabic ? [[t.language, t.arabic] as [string, string]] : []),
  ];

  return (
    <div className="mt-6 space-y-3">
      {(facts.length > 0 || core.length > 0) && (
        <section className="card p-4 md:p-5">
          <h2 className="font-semibold">{t.criteria}</h2>
          {facts.length > 0 && (
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              {facts.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 text-sm font-medium">{v}</dd></div>)}
            </dl>
          )}
          {core.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted">{t.skills}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">{core.map((s) => <Tag key={s}>{s}</Tag>)}</div>
            </div>
          )}
          {a.optionalSkills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted">{t.optionalSkills}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">{a.optionalSkills.map((s) => <Tag key={s}>{s}</Tag>)}</div>
            </div>
          )}
        </section>
      )}
      <List title={t.required} items={a.required} />
      <List title={t.duties} items={a.duties} />
      <List title={t.niceToHave} items={a.niceToHave} />
      <List title={t.benefits} items={a.benefits} />

      {/* Stays in the page because the JobPosting markup must match visible content. */}
      <details className="card p-4 md:p-5">
        <summary className="cursor-pointer font-semibold text-primary">{t.fullPosting}</summary>
        <div dir="ltr" lang="en" className="prose-job mt-3 whitespace-pre-line text-[15px]">{job.description}</div>
      </details>
      <p className="text-xs text-muted">
        {t.note}{" "}
        <a href={job.applyUrl} target="_blank" rel="noopener" className="font-medium text-primary hover:underline">{t.original}</a>
      </p>
    </div>
  );
}
