import type { Job } from "./types";

export interface JobFilters {
  q?: string; country?: string; city?: string; category?: string; mode?: string;
  seniority?: string; visa?: string; salary?: string; nationals?: string; direct?: string;
  posted?: string; sort?: string;
}

export function filterJobs(jobs: Job[], f: JobFilters, now: Date): Job[] {
  const terms = (f.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const out = jobs.filter((j) => {
    if (f.country && j.country !== f.country) return false;
    if (f.city && j.city?.toLowerCase() !== f.city.toLowerCase()) return false;
    if (f.category && j.category !== f.category) return false;
    if (f.mode && j.mode !== f.mode) return false;
    if (f.seniority && j.seniority !== f.seniority) return false;
    if (f.visa === "1" && !j.visaSponsored) return false;
    if (f.salary === "1" && !j.salary) return false;
    if (f.nationals === "1" && !j.nationalsPreferred) return false;
    if (f.direct === "1" && !j.directEmployer) return false;
    if (f.posted && now.getTime() - new Date(j.postedAt).getTime() > +f.posted * 864e5) return false;
    if (terms.length) {
      const hay = `${j.title} ${j.company} ${j.tags.join(" ")} ${j.location}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
  if (f.sort === "salary") {
    const v = (j: Job) => (j.salary ? (j.salary.max ?? 0) * (j.salary.period === "month" ? 12 : 1) * (RATE[j.salary.currency] ?? 1) : -1);
    out.sort((a, b) => v(b) - v(a));
  } else if (f.sort === "date") out.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return out;
}

// USD conversion for sorting
const RATE: Record<string, number> = { AED: 0.272, SAR: 0.267, QAR: 0.275, KWD: 3.25, OMR: 2.6, BHD: 2.65, INR: 0.012, USD: 1 };

/** Jobs per ?page=N of the job list. */
export const JOBS_PAGE_SIZE = 20;
