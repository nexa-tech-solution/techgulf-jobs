"use client";
import Link from "next/link";
import { useState } from "react";
import { actions, useStore, type AppStatus } from "@/lib/store";
import type { Dict, Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { CATEGORIES, COUNTRY_CODES, TO_AED } from "@/lib/format";
import { SALARY_BENCHMARKS } from "@/lib/mock-data";
import { inputCls } from "./ui";
import { BellIcon, CheckIcon, UploadIcon } from "./icons";

/* ---------- Alerts ---------- */
export function AlertForm({ d, initial }: { d: Dict; initial: { q?: string; country?: string; category?: string } }) {
  const { alerts } = useStore();
  const [channel, setChannel] = useState("whatsapp");
  const [done, setDone] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <form
        className="space-y-4 card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          actions.addAlert({ q: String(f.get("q")), country: String(f.get("country")), category: String(f.get("category")), channel, frequency: String(f.get("frequency")) });
          setDone(true);
        }}
      >
        <L label={d.keywords}><input name="q" defaultValue={initial.q} placeholder="React, Node.js" className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label={d.anywhere}>
            <select name="country" defaultValue={initial.country ?? ""} className={inputCls}>
              <option value="">{d.anywhere}</option>{COUNTRY_CODES.map((c) => <option key={c} value={c}>{d.country[c]}</option>)}
            </select>
          </L>
          <L label={d.allFields}>
            <select name="category" defaultValue={initial.category ?? ""} className={inputCls}>
              <option value="">{d.allFields}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{d.category[c]}</option>)}
            </select>
          </L>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{d.channel}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["whatsapp", "telegram", "email"] as const).map((c) => (
              <button type="button" key={c} onClick={() => setChannel(c)} aria-pressed={channel === c}
                className={`h-11 rounded-lg border text-sm font-medium ${channel === c ? "border-primary bg-primary/10 text-primary" : "border-line"}`}>{d[c]}</button>
            ))}
          </div>
        </fieldset>
        <L label={channel === "email" ? d.email : d.phone}>
          <input required type={channel === "email" ? "email" : "tel"} dir="ltr" placeholder={channel === "email" ? "you@example.com" : "+971 50 123 4567"} className={inputCls} />
        </L>
        <L label={d.frequency}>
          <select name="frequency" className={inputCls}><option value="instant">{d.instant}</option><option value="daily">{d.daily}</option><option value="weekly">{d.weekly}</option></select>
        </L>
        <label className="flex items-start gap-3 text-sm text-muted"><input required type="checkbox" className="mt-1 h-4 w-4 accent-[var(--primary)]" />{d.consent}</label>
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary"><BellIcon />{d.createAlert}</button>
        {done && <p className="flex items-center gap-2 text-sm text-success" role="status"><CheckIcon />{d.alertCreated}</p>}
      </form>
      <div className="card p-5 lg:self-start">
        <h2 className="font-semibold">{d.yourAlerts}</h2>
        {alerts.length === 0 && <p className="mt-2 text-sm text-muted">—</p>}
        <ul className="mt-3 space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm">
              <div>
                <p className="font-medium">{a.q || d.allFields}</p>
                <p className="text-xs text-muted">{[a.country && d.country[a.country as keyof Dict["country"]], d[a.channel as "email"], d[a.frequency as "daily"]].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={() => actions.removeAlert(a.id)} className="h-11 px-2 text-danger">{d.delete}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>
);

/* ---------- Saved + application tracker ---------- */
const STATUSES: AppStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

export function MyJobs({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const store = useStore();
  const [tab, setTab] = useState<"saved" | "tracker">("saved");
  const mine = jobs.filter((j) => store.jobs[j.id]);
  return (
    <div>
      <div className="flex gap-1 border-b border-line" role="tablist">
        {([["saved", d.savedTab], ["tracker", d.trackerTab]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`h-11 border-b-2 px-4 text-sm font-medium ${tab === k ? "border-primary text-primary" : "border-transparent text-muted"}`}>{label} ({mine.length})</button>
        ))}
      </div>
      {mine.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-muted">{d.emptySaved}</p>
          <Link href={`/${lang}/jobs`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.nav.jobs}</Link>
        </div>
      ) : tab === "saved" ? (
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
      ) : (
        <div className="mt-4 grid gap-3 overflow-x-auto md:grid-cols-5">
          {STATUSES.map((s) => (
            <div key={s} className="min-w-0 rounded-xl bg-surface p-3">
              <p className="mb-2 text-sm font-semibold">{d.status[s]} <span className="text-muted">({mine.filter((j) => store.jobs[j.id] === s).length})</span></p>
              <div className="space-y-2">
                {mine.filter((j) => store.jobs[j.id] === s).map((j) => (
                  <div key={j.id} className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
                    <Link href={`/${lang}/jobs/${j.id}`} className="font-medium hover:text-primary"><bdi>{j.title}</bdi></Link>
                    <p className="text-xs text-muted">{j.company}</p>
                    <select aria-label="Status" value={s} onChange={(e) => actions.setStatus(j.id, e.target.value as AppStatus)} className="mt-2 h-9 w-full rounded-md border border-line bg-surface px-2 text-xs">
                      {STATUSES.map((x) => <option key={x} value={x}>{d.status[x]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Salary explorer ---------- */
export function SalaryExplorer({ d }: { d: Dict }) {
  const [cat, setCat] = useState("");
  const [city, setCity] = useState("");
  const cities = [...new Set(SALARY_BENCHMARKS.map((b) => b.city))];
  const rows = SALARY_BENCHMARKS.filter((b) => (!cat || b.category === cat) && (!city || b.city === city));
  const fmt = (n: number, cur: string) => (cur === "INR" ? `₹${(n / 1e5).toFixed(0)} LPA` : `${cur} ${n.toLocaleString("en-US")}`);
  // Bars normalised to AED/month so roles are visually comparable
  const toAedMonth = (n: number, cur: string, per: string) => (per === "year" ? n / 12 : n) * (TO_AED[cur] ?? 1);
  const maxAed = Math.max(...rows.map((r) => toAedMonth(r.p75, r.currency, r.period)), 1);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} w-auto`} aria-label={d.allFields}>
          <option value="">{d.allFields}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{d.category[c]}</option>)}
        </select>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={`${inputCls} w-auto`} aria-label={d.city}>
          <option value="">{d.city}</option>{cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="mt-4 card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-start text-xs text-muted">
            <tr><th className="p-3 text-start">{d.role}</th><th className="p-3 text-start">{d.city}</th><th className="p-3 text-start">{d.median}</th><th className="hidden p-3 text-start sm:table-cell">{d.range}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const lo = toAedMonth(r.p25, r.currency, r.period) / maxAed, hi = toAedMonth(r.p75, r.currency, r.period) / maxAed;
              return (
                <tr key={r.role + r.city} className="border-t border-line">
                  <td className="p-3 font-medium">{r.role}</td>
                  <td className="p-3 text-muted">{r.city}</td>
                  <td className="p-3 font-semibold" dir="ltr">{fmt(r.p50, r.currency)}{r.period === "month" ? d.perMonth.replace("/", " /") : ""}</td>
                  <td className="hidden p-3 sm:table-cell">
                    <div className="relative h-2 w-40 rounded-full bg-surface-2" dir="ltr">
                      <div className="absolute h-2 rounded-full bg-primary" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted" dir="ltr">{fmt(r.p25, r.currency)} – {fmt(r.p75, r.currency)}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      <L label={d.allFields}><select className={inputCls}>{CATEGORIES.map((c) => <option key={c} value={c}>{d.category[c]}</option>)}</select></L>
      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
        <L label={d.form.salaryMin}><input type="number" dir="ltr" className={inputCls} /></L>
        <L label={d.form.salaryMax}><input type="number" dir="ltr" className={inputCls} /></L>
        <L label={d.form.currency}><select className={inputCls}>{["AED", "SAR", "QAR", "KWD", "OMR", "BHD", "INR", "USD"].map((c) => <option key={c}>{c}</option>)}</select></L>
      </div>
      <div className="sm:col-span-2"><L label={d.form.description}><textarea required rows={6} className={`${inputCls} h-auto py-2`} /></L></div>
      <L label={d.form.applyUrl}><input required dir="ltr" className={inputCls} /></L>
      <label className="flex min-h-11 items-center gap-3 self-end text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" />{d.form.visaOffered}</label>
      <button className="h-12 rounded-lg bg-primary font-semibold text-on-primary sm:col-span-2">{d.form.submit}</button>
    </form>
  );
}

/* ---------- CV match (UI preview, scores simulated) ---------- */
export function CvMatch({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const [file, setFile] = useState<string | null>(null);
  const mySkills = ["React", "TypeScript", "Node.js", "AWS", "PostgreSQL"];
  const scored = jobs.map((j) => {
    const have = j.tags.filter((t) => mySkills.includes(t));
    return { j, score: Math.round(40 + (have.length / Math.max(j.tags.length, 1)) * 58), missing: j.tags.filter((t) => !mySkills.includes(t)) };
  }).sort((a, b) => b.score - a.score).slice(0, 6);
  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface p-10 text-center hover:border-primary">
        <UploadIcon className="h-8 w-8 text-primary" />
        <span className="font-semibold">{file ?? d.upload}</span>
        <span className="text-sm text-muted">{d.dropHere}</span>
        <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
      </label>
      {file && (
        <ul className="mt-6 space-y-2">
          {scored.map(({ j, score, missing }) => (
            <li key={j.id} className="flex items-center gap-4 card p-4">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 text-sm font-bold ${score >= 75 ? "border-success text-success" : score >= 55 ? "border-accent text-accent" : "border-line text-muted"}`} dir="ltr">{score}%</div>
              <div className="min-w-0 flex-1">
                <Link href={`/${lang}/jobs/${j.id}`} className="font-semibold hover:text-primary"><bdi>{j.title}</bdi></Link>
                <p className="text-sm text-muted">{j.company} · {j.city ?? d.country.REMOTE}</p>
                {missing.length > 0 && <p className="mt-1 text-xs"><span className="text-muted">{d.missingSkills}:</span> <span dir="ltr" className="font-mono text-warning">{missing.join(", ")}</span></p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
