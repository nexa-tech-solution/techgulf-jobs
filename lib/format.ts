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
