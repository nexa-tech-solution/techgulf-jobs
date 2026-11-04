import type { MetadataRoute } from "next";
import { getCatalog, getGuidesContent, getPosts } from "@/lib/catalog";
import { BLOG_ENABLED } from "@/lib/blog";
import { buildLandings, isIndexable } from "@/lib/landing";
import { LANGS, SITE_URL } from "@/lib/seo";

const STATIC = ["", "/jobs", "/companies", "/salaries", "/guides", ...(BLOG_ENABLED ? ["/blog"] : []), "/cv", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ jobs, companies, cities }, posts, guides] = await Promise.all([getCatalog(), getPosts(), getGuidesContent("en")]);
  const hasJobs = (match: (j: (typeof jobs)[number]) => boolean) => jobs.some(match);
  const pages: [string, string?][] = [
    ...STATIC.map((p): [string] => [p]),
    ...jobs.map((j): [string, string] => [`/jobs/${j.id}`, j.postedAt]),
    // Pages without jobs are noindex, so they stay out of the sitemap too.
    ...companies.filter((c) => hasJobs((j) => j.companySlug === c.slug)).map((c): [string] => [`/companies/${c.slug}`]),
    ...cities.filter((c) => hasJobs((j) => j.city === c.name)).map((c): [string] => [`/cities/${c.slug}`]),
    ...buildLandings(jobs).filter(isIndexable).map((p): [string] => [`/browse/${p.slug}`]),
    ...(guides?.career ?? []).map((g): [string, string] => [`/guides/${g.slug}`, g.updated]),
    ...(BLOG_ENABLED ? posts : []).map((p): [string, string] => [`/blog/${p.slug}`, p.date]),
  ];
  return pages.flatMap(([path, date]) => LANGS.map((lang) => ({
    url: `${SITE_URL}/${lang}${path}`,
    ...(date && { lastModified: date }),
    alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
  })));
}
