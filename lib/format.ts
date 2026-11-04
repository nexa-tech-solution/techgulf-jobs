import type { Category, Country, Salary } from "./types";
import type { Dict } from "./i18n";

export const COUNTRY_CODES: Country[] = ["AE", "SA", "QA", "KW", "OM", "BH", "IN", "REMOTE"];
export const CATEGORIES: Category[] = ["backend", "frontend", "data-ai", "devops", "security", "erp", "qa", "network", "product", "support"];

// Indicative FX — replace with a daily feed
export const TO_INR: Record<string, number> = { AED: 22.7, SAR: 22.2, QAR: 22.9, KWD: 271, OMR: 216, BHD: 221, USD: 83.3, INR: 1 };
export const TO_AED: Record<string, number> = { AED: 1, SAR: 0.98, QAR: 1.01, KWD: 11.9, OMR: 9.5, BHD: 9.7, USD: 3.67, INR: 0.044 };

const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const lpa = (n?: number) => (n ? (n / 1e5).toFixed(n % 1e5 ? 1 : 0) : "?");

export function formatSalary(s: Salary, d: Dict): string {
  if (s.currency === "INR" && s.period === "year") return `₹${lpa(s.min)}–${lpa(s.max)} LPA`;
  const range = s.min && s.max && s.min !== s.max ? `${fmt(s.min)}–${fmt(s.max)}` : fmt(s.min ?? s.max ?? 0);
  return `${s.currency} ${range} ${s.period === "month" ? d.perMonth : d.perYear}`;
}

export function salaryConverted(s: Salary): string | null {
  const top = (s.max ?? s.min ?? 0) * (s.period === "month" ? 12 : 1);
  if (s.currency === "INR") return `≈ AED ${fmt((top * TO_AED.INR) / 12)}/mo`;
  if (!TO_INR[s.currency]) return null;
  return `≈ ₹${((top * TO_INR[s.currency]) / 1e5).toFixed(0)} LPA`;
}

export function timeAgo(iso: string, now: Date, d: Dict): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 864e5);
  if (days <= 0) return d.today;
  if (days === 1) return d.oneDayAgo;
  return d.daysAgo.replace("{n}", String(days));
}

export const isStale = (iso: string, now: Date) => now.getTime() - new Date(iso).getTime() > 30 * 864e5;

/** Deterministic 12-month series ending at the current median. */
export function medianTrend(p50: number, yoy: number, seed = 0): number[] {
  const wobble = [0.6, -0.4, 0.3, 0.8, -0.2, 0.5, -0.6, 0.2, 0.7, -0.3, 0.3, 0];
  return wobble.map((w, i) => Math.round(p50 * (1 - ((yoy / 100) * (11 - i)) / 12 + (w * (1 + (seed % 3) * 0.4)) / 100)));
}

/* ---------- User-shared salaries ---------- */
export const SALARY_ROLES: { role: string; category: Category }[] = [
  { role: "Backend Engineer", category: "backend" }, { role: "Frontend Engineer", category: "frontend" },
  { role: "Mobile Engineer", category: "frontend" }, { role: "DevOps Engineer", category: "devops" },
  { role: "Data Scientist", category: "data-ai" }, { role: "Data Engineer", category: "data-ai" },
  { role: "Cybersecurity Analyst", category: "security" }, { role: "SAP Consultant", category: "erp" },
  { role: "QA Engineer", category: "qa" }, { role: "Network Engineer", category: "network" },
  { role: "Product Manager", category: "product" }, { role: "IT Support", category: "support" },
];
export const COUNTRY_PAY: Partial<Record<Country, { currency: string; period: "month" | "year" }>> = {
  AE: { currency: "AED", period: "month" }, SA: { currency: "SAR", period: "month" }, QA: { currency: "QAR", period: "month" },
  KW: { currency: "KWD", period: "month" }, OM: { currency: "OMR", period: "month" }, BH: { currency: "BHD", period: "month" },
  IN: { currency: "INR", period: "year" },
};
/** Fewer people than this could expose one person's pay, so the group stays private. */
export const MIN_REPORTS = 5;

/** Rejects typos such as yearly pay in a monthly field. Bounds are AED per month. */
export function isPlausibleSalary(amount: number, currency: string, period: string) {
  const monthlyAed = (period === "year" ? amount / 12 : amount) * (TO_AED[currency] ?? 0);
  return monthlyAed >= 1000 && monthlyAed <= 200000;
}

const percentile = (sorted: number[], p: number) => {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  return Math.round(sorted[lo] + (sorted[Math.ceil(i)] - sorted[lo]) * (i - lo));
};

/** Reports are validated again here: Firestore rules cannot check them against these lists. */
export function aggregateSalaries(reports: Record<string, unknown>[], cities: Record<string, unknown>[]) {
  const countryOf = new Map(cities.map((c) => [c.name as string, c.country as Country]));
  const groups = new Map<string, { role: string; city: string; category: Category; currency: string; period: "month" | "year"; pay: number[] }>();
  for (const r of reports) {
    const role = SALARY_ROLES.find((x) => x.role === r.role);
    const city = r.city as string;
    const pay = COUNTRY_PAY[countryOf.get(city) as Country];
    const amount = r.amount as number;
    if (!role || !pay || typeof amount !== "number" || !isPlausibleSalary(amount, pay.currency, pay.period)) continue;
    const key = `${role.role} / ${city}`;
    if (!groups.has(key)) groups.set(key, { role: role.role, city, category: role.category, ...pay, pay: [] });
    groups.get(key)!.pay.push(amount);
  }
  const benchmarks = [];
  const pending: Record<string, number> = {};
  let sampleSize = 0;
  for (const [key, { pay, ...g }] of groups) {
    if (pay.length < MIN_REPORTS) { pending[key] = pay.length; continue; }
    pay.sort((a, b) => a - b);
    benchmarks.push({ ...g, p25: percentile(pay, 0.25), p50: percentile(pay, 0.5), p75: percentile(pay, 0.75), sample: pay.length });
    sampleSize += pay.length;
  }
  return { benchmarks, sampleSize, pending };
}
