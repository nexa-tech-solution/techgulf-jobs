"use client";
import Link from "next/link";
import { useState } from "react";
import { actions, useStore } from "@/lib/store";
import type { Dict, Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { CATEGORIES } from "@/lib/format";
import { inputCls } from "./ui";
import { Select } from "./select";
import { CheckIcon } from "./icons";

const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>
);

/* ---------- Saved jobs ---------- */

export function MyJobs({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const store = useStore();
  const mine = jobs.filter((j) => store.jobs[j.id]);
  return (
    <div>
      {mine.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-muted">{d.emptySaved}</p>
          <Link href={`/${lang}/jobs`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.nav.jobs}</Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {mine.map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-3 card p-4">
              <div className="min-w-0">
                <Link href={`/${lang}/jobs/${j.id}`} className="font-semibold hover:text-primary"><bdi>{j.title}</bdi></Link>
                <p className="text-sm text-muted">{j.company} · {j.city ?? d.country.REMOTE}</p>
              </div>
              <button onClick={() => actions.toggleSave(j.id)} className="h-11 shrink-0 px-2 text-sm text-danger">{d.delete}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Employer post job ---------- */
export function PostJobForm({ d }: { d: Dict }) {
  const [done, setDone] = useState(false);
  if (done) return <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-5 text-success" role="status"><CheckIcon />{d.form.submitted}</p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="grid gap-4 card p-5 sm:grid-cols-2">
      <L label={d.form.title}><input required className={inputCls} /></L>
      <L label={d.form.company}><input required className={inputCls} /></L>
      <L label={d.form.location}><input required placeholder="Dubai, UAE" className={inputCls} /></L>
      <L label={d.allFields}><Select name="category" defaultValue="backend" placeholder={d.allFields} options={CATEGORIES.map((c) => ({ value: c, label: d.category[c] }))} /></L>
      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
        <L label={d.form.salaryMin}><input type="number" dir="ltr" className={inputCls} /></L>
        <L label={d.form.salaryMax}><input type="number" dir="ltr" className={inputCls} /></L>
        <L label={d.form.currency}><Select name="currency" defaultValue="AED" placeholder={d.form.currency} options={["AED", "SAR", "QAR", "KWD", "OMR", "BHD", "INR", "USD"].map((c) => ({ value: c, label: c }))} /></L>
      </div>
      <div className="sm:col-span-2"><L label={d.form.description}><textarea required rows={6} className={`${inputCls} h-auto py-2`} /></L></div>
      <L label={d.form.applyUrl}><input required dir="ltr" className={inputCls} /></L>
      <label className="flex min-h-11 items-center gap-3 self-end text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" />{d.form.visaOffered}</label>
      <button className="h-12 rounded-lg bg-primary font-semibold text-on-primary sm:col-span-2">{d.form.submit}</button>
    </form>
  );
}
