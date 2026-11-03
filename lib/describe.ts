import type { Dict } from "./i18n";
import type { JobFilters } from "./jobs";

/** Human label for a saved search, e.g. "React · UAE · Visa sponsorship". */
export function describeFilters(f: JobFilters, d: Dict): string {
  const parts: string[] = [];
  if (f.q) parts.push(`“${f.q}”`);
  if (f.city) parts.push(f.city);
  if (f.country) parts.push(d.country[f.country as keyof Dict["country"]] ?? f.country);
  if (f.category) parts.push(d.category[f.category as keyof Dict["category"]] ?? f.category);
  if (f.mode) parts.push(d.mode[f.mode as keyof Dict["mode"]] ?? f.mode);
  if (f.seniority) parts.push(d.level[f.seniority as keyof Dict["level"]] ?? f.seniority);
  if (f.visa) parts.push(d.visa);
  if (f.salary) parts.push(d.salaryDisclosed);
  if (f.direct) parts.push(d.direct);
  if (f.nationals) parts.push(d.nationals);
  return parts.join(" · ") || d.account.allJobs;
}
