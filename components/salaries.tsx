"use client";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { CATEGORIES, TO_AED, medianTrend } from "@/lib/format";
import type { MarketData, SalaryBenchmark } from "@/lib/types";
import { Select } from "./select";

type Bench = SalaryBenchmark;
const cityVar = (c: string) => `var(--city-${c.toLowerCase().replace(/\s+/g, "-")})`;
const USD_PER_AED = 0.2723;
const toUsdMonth = (n: number, cur: string, per: string) => (per === "year" ? n / 12 : n) * (TO_AED[cur] ?? 1) * USD_PER_AED;
const fmtNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function money(n: number, b: Pick<Bench, "currency" | "period">, usd: boolean) {
  if (usd) return `$${fmtNum(toUsdMonth(n, b.currency, b.period))}`;
  return b.currency === "INR" ? `₹${(n / 1e5).toFixed(0)} LPA` : `${b.currency} ${fmtNum(n)}`;
}

function Delta({ v }: { v: number }) {
  const up = v > 0;
  return (
    <span dir="ltr" className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${v === 0 ? "text-muted" : up ? "text-success" : "text-danger"}`}>
      <span aria-hidden>{v === 0 ? "" : up ? "↑" : "↓"}</span>{Math.abs(v).toFixed(1).replace(".0", "")}%
    </span>
  );
}

/* ---------------- Trend line chart ---------------- */
function TrendChart({ series, d, months }: { series: { city: string; data: number[] }[]; d: Dict; months: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const h = 280, pad = { t: 16, r: 84, b: 28, l: 48 };
  const all = series.flatMap((s) => s.data);
  const step = 1000;
  const min = Math.floor((Math.min(...all) * 0.96) / step) * step;
  const max = Math.ceil((Math.max(...all) * 1.02) / step) * step;
  const x = (i: number) => pad.l + (i / (months.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const ticks = Array.from({ length: 4 }, (_, i) => min + ((max - min) * i) / 3);

  // De-collide end labels
  const ends = series.map((s) => ({ city: s.city, y: y(s.data[s.data.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((px - pad.l) / (w - pad.l - pad.r)) * (months.length - 1));
    setHover(Math.min(months.length - 1, Math.max(0, i)));
  };

  return (
    <div ref={box} className="relative" dir="ltr">
      <svg width={w} height={h} role="img" aria-label={d.salary.chartLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="block touch-pan-y">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === min ? undefined : "2 4"} />
            <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">${fmtNum(t / 1000)}k</text>
          </g>
        ))}
        {months.map((m, i) => (i % 2 === 1 || i === months.length - 1) && (
          <text key={m + i} x={x(i)} y={h - 8} textAnchor="middle" className="fill-muted text-[11px]">{m}</text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b} stroke="var(--muted)" strokeWidth={1} />}
        {series.map((s) => (
          <g key={s.city} style={{ color: cityVar(s.city) }}>
            <polyline points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && <circle cx={x(hover)} cy={y(s.data[hover])} r={4.5} fill="currentColor" stroke="var(--surface)" strokeWidth={2} />}
          </g>
        ))}
        {ends.map((e) => {
          const s = series.find((x) => x.city === e.city)!;
          return (
            <g key={e.city}>
              <circle cx={w - pad.r + 10} cy={e.y} r={3.5} fill={cityVar(e.city)} />
              <text x={w - pad.r + 18} y={e.y} dy="0.32em" className="fill-ink text-[12px] font-medium">{e.city}</text>
              <title>{`${s.city}: $${fmtNum(s.data[s.data.length - 1])}`}</title>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_-12px_rgb(15_23_42/0.3)]"
          style={{ left: Math.min(x(hover) + 12, w - 176) }}>
          <p className="mb-1 font-semibold">{months[hover]} {hover === 0 ? "2025" : "2026"}</p>
          {[...series].sort((a, b) => b.data[hover] - a.data[hover]).map((s) => (
            <p key={s.city} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: cityVar(s.city) }} />{s.city}</span>
              <span className="font-semibold tabular-nums">${fmtNum(s.data[hover])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Page body ---------------- */
const ROLE_TABS = ["Backend Engineer", "DevOps Engineer", "Data Scientist", "Frontend Engineer", "Cybersecurity Analyst"];

export function SalaryDashboard({ d, lang, market }: { d: Dict; lang: string; market: MarketData }) {
  const { benchmarks: SALARY_BENCHMARKS, techTrends: TECH_TRENDS, notes: MARKET_NOTES, trendMonths: TREND_MONTHS } = market;
  const yoyOf = (role: string, city: string) => market.yoy[`${role}|${city}`] ?? 0;
  const [usd, setUsd] = useState(false);
  const [role, setRole] = useState(ROLE_TABS[0]);
  const [city, setCity] = useState("");
  const [cat, setCat] = useState("");
  const cities = [...new Set(SALARY_BENCHMARKS.map((b) => b.city))];

  const roleRows = SALARY_BENCHMARKS.filter((b) => b.role === role);
  const series = roleRows.map((b, i) => ({
    city: b.city,
    data: medianTrend(b.p50, yoyOf(b.role, b.city), i).map((v) => Math.round(toUsdMonth(v, b.currency, b.period))),
  }));

  const rows = SALARY_BENCHMARKS.filter((b) => (!city || b.city === city) && (!cat || b.category === cat));
  const maxUsd = Math.max(...SALARY_BENCHMARKS.map((r) => toUsdMonth(r.p75, r.currency, r.period)));
  const techs = TECH_TRENDS.filter((t) => !cat || t.category === cat);
  const maxDemand = Math.max(...TECH_TRENDS.map((t) => Math.abs(t.demand)));
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short" });

  const hasHistory = Object.keys(market.yoy).length > 0;
  const seg = (on: boolean) => `h-8 rounded-md px-3 text-sm font-medium transition ${on ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"}`;

  if (!SALARY_BENCHMARKS.length) return (
    <div className="rounded-2xl border border-line bg-surface p-10 text-center">
      <h2 className="text-lg font-semibold">{d.contribute.emptyTitle}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{d.contribute.emptySub}</p>
      <a href={`/${lang}/salaries/contribute`} className="mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.contribute.cta}</a>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* ---------- Trend: needs real history ---------- */}
      {hasHistory && <section className="rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <h2 className="text-lg font-semibold">{d.salary.trendTitle}</h2>
            <p className="mt-0.5 text-sm text-muted">{d.salary.trendSub}</p>
          </div>
          <div className="inline-flex rounded-lg bg-surface-2 p-1" role="group" aria-label="Currency">
            <button type="button" aria-pressed={!usd} onClick={() => setUsd(false)} className={seg(!usd)}>{d.salary.local}</button>
            <button type="button" aria-pressed={usd} onClick={() => setUsd(true)} className={seg(usd)}>USD</button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-line px-3 [scrollbar-width:none]" role="tablist">
          {ROLE_TABS.map((r) => (
            <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
              className={`-mb-px h-11 shrink-0 border-b-2 px-3 text-sm font-medium transition ${role === r ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>{r}</button>
          ))}
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" dir="ltr">
              {series.map((s) => <span key={s.city} className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: cityVar(s.city) }} />{s.city}</span>)}
              <span>· USD / month</span>
            </div>
            <TrendChart series={series} d={d} months={TREND_MONTHS} />
          </div>
          <ul className="space-y-3 lg:border-s lg:border-line lg:ps-6">
            {roleRows.map((b) => (
              <li key={b.city}>
                <p className="flex items-center gap-2 text-sm text-muted"><span className="h-2 w-2 rounded-full" style={{ background: cityVar(b.city) }} />{b.city}</p>
                <p className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums" dir="ltr">{money(b.p50, b, usd)}</span>
                  <Delta v={yoyOf(b.role, b.city)} />
                </p>
                <p className="text-xs text-muted">{b.period === "month" || usd ? d.salary.perMonthMedian : d.salary.perYearMedian}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>}

      {/* ---------- All roles ---------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{d.salary.byRole}</h2>
            <p className="mt-0.5 text-sm text-muted">{usd ? d.salary.usdNote : d.salary.monthlyNote}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select variant="pill" placeholder={d.salary.allCities} value={city} onChange={setCity}
              options={[{ value: "", label: d.salary.allCities }, ...cities.map((c) => ({ value: c, label: c }))]} />
            <Select variant="pill" placeholder={d.allFields} value={cat} onChange={setCat}
              options={[{ value: "", label: d.allFields }, ...CATEGORIES.map((c) => ({ value: c, label: d.category[c] }))]} />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{d.role}</th>
                <th className="px-5 py-3 text-start font-medium">{d.median}</th>
                <th className="px-5 py-3 text-start font-medium">{d.range}</th>
                {hasHistory && <th className="px-5 py-3 text-end font-medium">{d.salary.yoy}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const lo = toUsdMonth(r.p25, r.currency, r.period) / maxUsd;
                const hi = toUsdMonth(r.p75, r.currency, r.period) / maxUsd;
                const mid = toUsdMonth(r.p50, r.currency, r.period) / maxUsd;
                return (
                  <tr key={r.role + r.city} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{r.role}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: cityVar(r.city) }} />{r.city}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums" dir="ltr">{money(r.p50, r, usd)}</td>
                    <td className="px-5 py-3.5" title={`${money(r.p25, r, usd)} – ${money(r.p75, r, usd)}`}>
                      <div className="relative h-2 w-52 rounded-full bg-surface-2" dir="ltr">
                        <div className="absolute h-2 rounded-full bg-primary/25" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
                        <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-primary ring-2 ring-surface" style={{ left: `${mid * 100}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs tabular-nums text-muted" dir="ltr">{money(r.p25, r, usd)} – {money(r.p75, r, usd)}</p>
                    </td>
                    {hasHistory && <td className="px-5 py-3.5 text-end"><Delta v={yoyOf(r.role, r.city)} /></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">{d.noResults}</p>}
        </div>
      </section>

      {/* ---------- Technologies + notes ---------- */}
      {TECH_TRENDS.length > 0 && <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{d.salary.techTitle}</h2>
          <p className="mt-0.5 text-sm text-muted">{d.salary.techSub}</p>
          <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 grid grid-cols-[130px_1fr_72px_64px] gap-3 text-xs text-muted sm:grid-cols-[160px_1fr_88px_72px]">
              <span>{d.salary.tech}</span>
              <span className="flex justify-between" dir="ltr"><span>← {d.salary.falling}</span><span>{d.salary.rising} →</span></span>
              <span className="text-end">{d.salary.premium}</span>
              <span className="text-end">{d.salary.openJobs}</span>
            </div>
            <ul className="space-y-1">
              {techs.map((t) => {
                const pct = (Math.abs(t.demand) / maxDemand) * 50;
                return (
                  <li key={t.tech}>
                    <a href={`/${lang}/jobs?q=${encodeURIComponent(t.tech.split(" ")[0])}`} title={`${t.tech}: ${t.demand > 0 ? "+" : ""}${t.demand}% postings, ${t.premium > 0 ? "+" : ""}${t.premium}% salary`}
                      className="grid grid-cols-[130px_1fr_72px_64px] items-center gap-3 rounded-lg py-1.5 hover:bg-surface-2 sm:grid-cols-[160px_1fr_88px_72px]">
                      <span className="truncate ps-1 font-mono text-[13px] font-medium" dir="ltr">{t.tech}</span>
                      <span className="relative h-6" dir="ltr">
                        <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                        <span className={`absolute top-1 h-4 ${t.demand >= 0 ? "rounded-e" : "rounded-s"}`}
                          style={{ background: t.demand >= 0 ? "var(--pos)" : "var(--neg)", width: `${pct}%`, ...(t.demand >= 0 ? { left: "50%" } : { right: "50%" }) }} />
                        <span className="absolute top-0 text-[11px] font-semibold tabular-nums leading-6 text-ink"
                          style={t.demand >= 0 ? { left: `calc(50% + ${pct}% + 6px)` } : { right: `calc(50% + ${pct}% + 6px)` }}>
                          {t.demand > 0 ? "+" : "−"}{Math.abs(t.demand)}%
                        </span>
                      </span>
                      <span className="text-end"><Delta v={t.premium} /></span>
                      <span className="pe-1 text-end text-xs tabular-nums text-muted" dir="ltr">{fmtNum(t.jobs)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <aside className="lg:pt-[3.6rem]">
          <div className="rounded-2xl border border-line bg-surface">
            <p className="border-b border-line px-5 py-3.5 text-sm font-semibold">{d.salary.notes}</p>
            <ol className="relative px-5 py-4">
              {MARKET_NOTES.map((n) => (
                <li key={n.date} className="relative border-s border-line pb-5 ps-4 last:pb-0">
                  <span className="absolute -start-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
                  <p className="text-xs font-medium text-muted">{dateFmt(n.date)}</p>
                  <p className="mt-1 text-sm leading-relaxed" dir="ltr" lang="en">{n.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>}
    </div>
  );
}
