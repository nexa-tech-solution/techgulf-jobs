"use client";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { TO_AED } from "@/lib/format";
import { ShieldIcon } from "./icons";

type Region = "UAE" | "KSA" | "QA" | "IN";
interface Guide { region: Region; title: string; summary: string; mins: number; updated: string; steps: string[] }

const GUIDES: Guide[] = [
  { region: "UAE", title: "UAE work visa for developers", mins: 6, updated: "2026-10-28",
    summary: "What happens between signing an offer and getting your Emirates ID — and who pays for what.",
    steps: ["Employer applies for your entry permit (3–5 working days).", "Enter the UAE and complete the medical fitness test.", "Biometrics for Emirates ID; visa stamped in 1–2 weeks.", "By law the employer pays all visa and medical costs."] },
  { region: "UAE", title: "Golden Visa for tech talent", mins: 4, updated: "2026-09-12",
    summary: "A 10-year residence that doesn't depend on your employer. Who qualifies and how to apply.",
    steps: ["Salary of AED 30,000+/month or a recognised tech specialism.", "Degree attested by UAE Ministry of Education.", "Apply via ICP or GDRFA; decision usually within 30 days."] },
  { region: "KSA", title: "Saudi Iqama, step by step", mins: 7, updated: "2026-10-20",
    summary: "From work visa to Iqama, plus how Saudization (Nitaqat) affects which roles are open to you.",
    steps: ["Employer issues work visa via Qiwa; you get it stamped at the embassy.", "Arrive, complete medical and biometrics.", "Iqama issued digitally on Absher within ~2 weeks.", "Look for the “Nationals preferred” label — some roles are quota-reserved."] },
  { region: "QA", title: "Qatar residence permit (QID)", mins: 5, updated: "2026-08-30",
    summary: "Work permit, QID and changing jobs since Qatar removed the exit-permit rule.",
    steps: ["Employer applies for work visa through the Ministry of Labour.", "Medical and fingerprinting at a Qatar Visa Centre.", "QID issued; you can change employers after notice period."] },
  { region: "IN", title: "Moving from India to the Gulf", mins: 8, updated: "2026-11-01",
    summary: "Paperwork to start before you resign, so your visa isn't stuck for weeks.",
    steps: ["Attest your degree: state HRD → MEA apostille → embassy.", "Check if ECR applies to your passport (usually not for graduates).", "Keep salary slips and relieving letter — Gulf employers ask for both.", "Open an NRE account once you land to send money home tax-free."] },
  { region: "IN", title: "Negotiating a Gulf offer in INR terms", mins: 5, updated: "2026-10-05",
    summary: "How to compare a tax-free AED/SAR package with your LPA salary, including housing and flights.",
    steps: ["Convert basic + housing + transport, not just basic.", "Add annual flight allowance and end-of-service gratuity.", "Subtract rent if housing isn't provided — it's the biggest cost."] },
];

const JOURNEY = [
  { t: "Attest documents", s: "2–4 weeks", d: "Degree attestation and police clearance — start before you apply." },
  { t: "Interview & offer", s: "2–6 weeks", d: "Most Gulf tech hiring is 3–4 rounds, often fully remote." },
  { t: "Entry permit", s: "3–10 days", d: "Employer files it; you never pay for this." },
  { t: "Arrive & medical", s: "Week 1", d: "Medical test, biometrics, open a bank account." },
  { t: "Residence ID", s: "Week 2–3", d: "Emirates ID / Iqama / QID — then lease, SIM and car loan are possible." },
];

const COST = [
  { city: "Dubai", cur: "AED", rent: 7500, transport: 600, food: 1800, salary: 27000 },
  { city: "Riyadh", cur: "SAR", rent: 4500, transport: 900, food: 1600, salary: 25000 },
  { city: "Doha", cur: "QAR", rent: 6500, transport: 700, food: 1700, salary: 25000 },
  { city: "Bengaluru", cur: "INR", rent: 30000, transport: 4000, food: 12000, salary: 250000 },
];
const usd = (n: number, cur: string) => n * (TO_AED[cur] ?? 1) * 0.2723;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const SEG = [
  { key: "rent", color: "var(--city-dubai)" },
  { key: "transport", color: "var(--city-riyadh)" },
  { key: "food", color: "var(--city-doha)" },
] as const;

export function GuidesHub({ d, lang }: { d: Dict; lang: string }) {
  const g = d.guidesPage;
  const [region, setRegion] = useState<Region | "">("");
  const list = GUIDES.filter((x) => !region || x.region === region);
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const maxSalary = Math.max(...COST.map((c) => usd(c.salary, c.cur)));
  const regions: [Region | "", string][] = [["", g.all], ["UAE", d.country.AE], ["KSA", d.country.SA], ["QA", d.country.QA], ["IN", g.fromIndia]];

  return (
    <div className="space-y-14">
      {/* Guides */}
      <section>
        <div className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" role="tablist">
          {regions.map(([k, label]) => (
            <button key={k || "all"} role="tab" aria-selected={region === k} onClick={() => setRegion(k)}
              className={`-mb-px h-11 shrink-0 border-b-2 px-4 text-sm font-medium transition ${region === k ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {label} <span className="text-muted">{GUIDES.filter((x) => !k || x.region === k).length}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
          {list.map((x) => (
            <details key={x.title} className="group rounded-2xl border border-line bg-surface transition open:border-ink/25">
              <summary className="cursor-pointer list-none p-5">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 font-medium text-ink">{regions.find(([k]) => k === x.region)?.[1]}</span>
                  <span>{g.minRead.replace("{n}", String(x.mins))}</span>
                  <span aria-hidden>·</span>
                  <span>{g.updated} {dateFmt(x.updated)}</span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div dir="ltr" lang="en" className="text-start">
                    <h3 className="text-lg font-semibold leading-snug">{x.title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{x.summary}</p>
                  </div>
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45" aria-hidden>+</span>
                </div>
              </summary>
              <ol className="space-y-3 border-t border-line px-5 py-4" dir="ltr" lang="en">
                {x.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </section>

      {/* Journey */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight">{g.journeyTitle}</h2>
        <p className="mt-1 text-sm text-muted">{g.journeySub}</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-5" dir="ltr" lang="en">
          {JOURNEY.map((j, i) => (
            <li key={j.t} className="relative md:pt-8">
              {i < JOURNEY.length - 1 && <span className="absolute left-3 top-3 hidden h-px w-full bg-line md:block" aria-hidden />}
              <span className="absolute left-0 top-0 hidden h-6 w-6 place-items-center rounded-full border-2 border-primary bg-surface text-[11px] font-bold text-primary md:grid">{i + 1}</span>
              <div className="rounded-xl border border-line bg-surface p-4 md:border-0 md:bg-transparent md:p-0">
                <p className="text-xs font-medium text-primary">{j.s}</p>
                <p className="mt-1 font-semibold">{j.t}</p>
                <p className="mt-1 text-sm text-muted">{j.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Cost vs salary */}
      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{g.costTitle}</h2>
            <p className="mt-1 text-sm text-muted">{g.costSub}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {SEG.map((s) => <span key={s.key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{d[s.key]}</span>)}
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-muted" />{g.leftOver}</span>
          </div>
        </div>
        <ul className="mt-6 space-y-5" dir="ltr">
          {COST.map((c) => {
            const total = c.rent + c.transport + c.food;
            const save = usd(c.salary - total, c.cur);
            const savePct = Math.round(((c.salary - total) / c.salary) * 100);
            return (
              <li key={c.city} className="grid gap-2 md:grid-cols-[120px_1fr_150px] md:items-center md:gap-4">
                <div><p className="font-semibold">{c.city}</p><p className="text-xs text-muted">{g.medianSalary} ${fmt(usd(c.salary, c.cur))}</p></div>
                <div className="flex h-7 overflow-hidden rounded-md" style={{ width: `${(usd(c.salary, c.cur) / maxSalary) * 100}%`, gap: 2 }}>
                  {SEG.map((s) => {
                    const v = c[s.key];
                    return <span key={s.key} title={`${d[s.key]}: ${c.cur} ${fmt(v)} ($${fmt(usd(v, c.cur))})`} className="h-full first:rounded-s-md" style={{ width: `${(v / c.salary) * 100}%`, background: s.color }} />;
                  })}
                  <span className="h-full flex-1 rounded-e-md border border-dashed border-muted/60" title={`${g.leftOver}: $${fmt(save)}`} />
                </div>
                <p className="text-sm md:text-end">
                  <span className="font-semibold tabular-nums">${fmt(save)}</span> <span className="text-muted">{g.perMonth}</span>
                  <span className="block text-xs text-muted">{g.ofSalary.replace("{n}", String(savePct))}</span>
                </p>
              </li>
            );
          })}
        </ul>
        <details className="mt-6 border-t border-line pt-4 text-sm">
          <summary className="cursor-pointer font-medium text-primary">{g.showTable}</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px]" dir="ltr">
              <thead className="text-xs text-muted"><tr>{[d.city, d.rent, d.transport, d.food, d.total].map((h) => <th key={h} className="py-2 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {COST.map((c) => (
                  <tr key={c.city} className="border-t border-line tabular-nums">
                    <td className="py-2 font-medium">{c.city}</td>
                    <td className="py-2">{c.cur} {fmt(c.rent)}</td><td className="py-2">{c.cur} {fmt(c.transport)}</td><td className="py-2">{c.cur} {fmt(c.food)}</td>
                    <td className="py-2 font-semibold">{c.cur} {fmt(c.rent + c.transport + c.food)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="flex gap-3 rounded-2xl border border-danger/25 bg-danger/5 p-5">
        <ShieldIcon className="h-6 w-6 shrink-0 text-danger" />
        <div>
          <p className="font-semibold text-danger">{g.scamTitle}</p>
          <p className="mt-1 text-sm">{d.scamWarn}</p>
        </div>
      </div>
    </div>
  );
}
