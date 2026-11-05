import type { Dict, Locale } from "./i18n";
import type { Category, City, Country, Job } from "./types";

// Below this a page exists for visitors but stays out of Google and the sitemap, to avoid thin content.
export const MIN_INDEX_JOBS = 3;

export interface Landing {
  slug: string;
  what: { kind: "skill"; skill: string } | { kind: "category"; category: Category };
  where: { kind: "city"; city: string; country?: Country } | { kind: "country"; country: Country };
  /** Narrows the page to jobs with visa sponsorship or a listed salary. */
  only?: "visa" | "salary";
  jobs: Job[];
}

const slugify = (text: string) => text.toLowerCase()
  .replace(/c#/g, "csharp").replace(/\.net/g, "dotnet").replace(/\.js/g, "js")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Every skill or field combined with every city or country that has at least one job. */
export function buildLandings(jobs: Job[]): Landing[] {
  const pages = new Map<string, Landing>();
  const put = (slug: string, base: Omit<Landing, "slug" | "jobs">, job: Job) => {
    const page = pages.get(slug) ?? { ...base, slug, jobs: [] };
    page.jobs.push(job);
    pages.set(slug, page);
  };
  const add = (slugWhat: string, what: Landing["what"], slugWhere: string, where: Landing["where"], job: Job) => {
    put(`${slugWhat}-jobs-in-${slugWhere}`, { what, where }, job);
    if (job.visaSponsored) put(`${slugWhat}-jobs-with-visa-sponsorship-in-${slugWhere}`, { what, where, only: "visa" }, job);
    if (job.salary) put(`${slugWhat}-jobs-with-salary-in-${slugWhere}`, { what, where, only: "salary" }, job);
  };
  const countrySlug: Partial<Record<Country, string>> = { AE: "uae", SA: "saudi-arabia", QA: "qatar", KW: "kuwait", OM: "oman", BH: "bahrain", IN: "india" };

  for (const job of jobs) {
    const places: [string, Landing["where"]][] = [];
    if (job.city) places.push([slugify(job.city), { kind: "city", city: job.city, country: job.country }]);
    const inCountry = job.country && countrySlug[job.country];
    if (job.country && inCountry) places.push([inCountry, { kind: "country", country: job.country }]);
    for (const [slugWhere, where] of places) {
      add(job.category, { kind: "category", category: job.category }, slugWhere, where, job);
      for (const skill of job.tags) add(slugify(skill), { kind: "skill", skill }, slugWhere, where, job);
    }
  }
  return [...pages.values()].sort((a, b) => b.jobs.length - a.jobs.length);
}

export const isIndexable = (page: Landing) => page.jobs.length >= MIN_INDEX_JOBS;

export function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export const cityArabic = (cities: City[], name: string) => cities.find((c) => c.name === name)?.ar ?? name;

/** The page's localized "what" and "where", and its heading. */
export function landingLabels(page: Pick<Landing, "what" | "where" | "only">, d: Dict, lang: Locale, cities: City[]) {
  const what = page.what.kind === "skill" ? page.what.skill : d.category[page.what.category];
  const where = page.where.kind === "country" ? d.country[page.where.country]
    : lang === "ar" ? cityArabic(cities, page.where.city) : page.where.city;
  const t = d.landing;
  const heading = (page.only === "visa" ? t.headingVisa : page.only === "salary" ? t.headingSalary : t.heading)
    .replace("{what}", what).replace("{where}", where);
  return { what, where, heading };
}
