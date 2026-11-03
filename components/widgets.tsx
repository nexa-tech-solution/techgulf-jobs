"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { actions, useStore, type Alert, type AppStatus, type Channel } from "@/lib/store";
import { describeFilters } from "@/lib/describe";
import { filterJobs } from "@/lib/jobs";
import { TODAY } from "@/lib/mock-data";
import type { Dict, Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { CATEGORIES } from "@/lib/format";
import { inputCls } from "./ui";
import { Select } from "./select";
import { BellIcon, CheckIcon } from "./icons";

/* ---------- Alerts (managed inside My jobs) ---------- */
function AlertsManager({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const { alerts, user } = useStore();
  if (alerts.length === 0)
    return (
      <div className="mt-6 rounded-xl border border-dashed border-line bg-surface p-8 text-center">
        <BellIcon className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 font-semibold">{d.account.noAlerts}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{d.account.noAlertsHint}</p>
        <Link href={`/${lang}/jobs`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.nav.jobs}</Link>
      </div>
    );
  const channels: Channel[] = ["email", "whatsapp", "telegram"];
  return (
    <ul className="mt-4 space-y-3">
      {alerts.map((a) => {
        const n = filterJobs(jobs, a.filters, TODAY).length;
        const qs = new URLSearchParams(a.filters).toString();
        return (
          <li key={a.id} className="rounded-xl border border-line bg-surface p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{describeFilters(a.filters, d)}</p>
                <Link href={`/${lang}/jobs${qs ? `?${qs}` : ""}`} className="text-sm text-primary hover:underline">{d.account.matching.replace("{n}", String(n))}</Link>
              </div>
              <button onClick={() => actions.removeAlert(a.id)} className="h-9 rounded-lg px-3 text-sm text-muted hover:text-danger">{d.delete}</button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <span className="me-1 text-xs text-muted">{d.account.sendTo}</span>
              {channels.map((c) => {
                const on = a.channels.includes(c);
                return (
                  <button key={c} type="button" aria-pressed={on}
                    onClick={() => {
                      const next = on ? a.channels.filter((x) => x !== c) : [...a.channels, c];
                      if (next.length) actions.updateAlert(a.id, { channels: next });
                    }}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${on ? "border-primary bg-primary/10 text-primary" : "border-dashed border-line text-muted hover:text-ink"}`}>
                    {on ? "✓" : "+"} {d[c]}{c === "email" && on && user && <span className="font-normal text-muted" dir="ltr">({user.email})</span>}
                  </button>
                );
              })}
              <Select variant="pill" placeholder={d.frequency} value={a.frequency} onChange={(v) => actions.updateAlert(a.id, { frequency: v as Alert["frequency"] })}
                className="ms-auto [&>button]:h-8 [&>button]:border-line [&>button]:bg-surface [&>button]:text-[13px] [&>button]:text-ink"
                options={[{ value: "instant", label: d.instant }, { value: "daily", label: d.daily }, { value: "weekly", label: d.weekly }]} />
            </div>
          </li>
        );
      })}
      <li className="text-xs text-muted">{d.account.whatsappNote}</li>
    </ul>
  );
}

const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>
);

/* ---------- Saved + application tracker ---------- */
const STATUSES: AppStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

export function MyJobs({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const store = useStore();
  const [tab, setTab] = useState<"saved" | "tracker" | "alerts">("saved");
  useEffect(() => {
    const sync = () => { if (location.hash === "#alerts") setTab("alerts"); };
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);
  const mine = jobs.filter((j) => store.jobs[j.id]);
  return (
    <div>
      <div className="flex gap-1 border-b border-line" role="tablist">
        {([["saved", d.savedTab, mine.length], ["tracker", d.trackerTab, mine.filter((j) => store.jobs[j.id] !== "saved").length], ["alerts", d.account.alertsTab, store.alerts.length]] as const).map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); history.replaceState(null, "", k === "alerts" ? "#alerts" : location.pathname); }}
            className={`-mb-px h-11 border-b-2 px-4 text-sm font-medium ${tab === k ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>{label} <span className="text-muted">{n}</span></button>
        ))}
      </div>
      {tab === "alerts" ? <AlertsManager d={d} lang={lang} jobs={jobs} /> : mine.length === 0 ? (
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
                    <Select className="mt-2 [&>button]:h-9 [&>button]:text-xs" placeholder="Status" value={s} onChange={(v) => actions.setStatus(j.id, v as AppStatus)} options={STATUSES.map((x) => ({ value: x, label: d.status[x] }))} />
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
