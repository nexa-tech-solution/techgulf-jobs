import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import type { Company, Country, Job } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { CompanyDirectory, type CompanyStats } from "@/components/company-directory";

export const metadata: Metadata = { title: "Tech companies hiring in the Gulf & India" };

const HQ_COUNTRY: [RegExp, Country][] = [[/UAE/, "AE"], [/Saudi/, "SA"], [/Qatar/, "QA"], [/India/, "IN"]];

function stats(companies: Company[], allJobs: Job[]): CompanyStats[] {
  return companies.filter((c) => c.ats !== "direct").map((company) => {
    const jobs = allJobs.filter((j) => j.companySlug === company.slug);
    const tagCount = new Map<string, number>();
    jobs.flatMap((j) => j.tags).forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1));
    return {
      company,
      country: HQ_COUNTRY.find(([re]) => re.test(company.hq))?.[1] ?? "AE",
      open: jobs.length,
      salaryPct: jobs.length ? Math.round((jobs.filter((j) => j.salary).length / jobs.length) * 100) : 0,
      visa: jobs.some((j) => j.visaSponsored),
      remote: jobs.some((j) => j.mode === "remote"),
      tags: [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t),
      cities: [...new Set(jobs.map((j) => j.city).filter(Boolean) as string[])],
    };
    // A directory card with nothing to apply for is a dead end.
  }).filter((i) => i.open > 0);
}

export default async function Companies(props: PageProps<"/[lang]/companies">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const { jobs, companies } = await getCatalog();
  const items = stats(companies, jobs);
  const open = items.reduce((n, i) => n + i.open, 0);
  const visa = items.filter((i) => i.visa).length;
  return (
    <>
      <PageHeader title={d.companiesTitle} sub={d.companiesPage.sub}>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {[[items.length, d.companiesPage.statCompanies], [open, d.companiesPage.statRoles], [visa, d.companiesPage.statVisa]].map(([n, l]) => (
            <div key={l}><dt className="text-sm text-muted">{l}</dt><dd className="text-2xl font-semibold tabular-nums">{n}</dd></div>
          ))}
        </dl>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-8"><CompanyDirectory d={d} lang={lang} items={items} /></div>
    </>
  );
}
