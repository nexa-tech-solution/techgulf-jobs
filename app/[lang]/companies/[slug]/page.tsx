import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, type Locale } from "@/lib/i18n";
import { COMPANIES } from "@/lib/mock-data";
import { getCompany, jobsByCompany } from "@/lib/jobs";
import { JobCard } from "@/components/job-card";
import { Logo } from "@/components/ui";
import { ExternalIcon } from "@/components/icons";

export const generateStaticParams = () => COMPANIES.map((c) => ({ slug: c.slug }));

export async function generateMetadata(props: PageProps<"/[lang]/companies/[slug]">): Promise<Metadata> {
  const c = await getCompany((await props.params).slug);
  return c ? { title: `${c.name} careers – ${jobsByCompany(c.slug).length} open tech jobs` } : {};
}

export default async function CompanyPage(props: PageProps<"/[lang]/companies/[slug]">) {
  const { lang: l, slug } = await props.params;
  const lang = l as Locale;
  const d = getDict(lang);
  const c = await getCompany(slug);
  if (!c) notFound();
  const jobs = jobsByCompany(slug);
  const facts: [string, string][] = [[d.industry, c.industry], [d.hq, c.hq], [d.employees, c.size], [d.ats, c.ats]];
  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-center gap-4">
            <Logo company={c} size={64} />
            <div>
              <h1 className="text-2xl font-bold md:text-[32px]">{c.name}</h1>
              <p className="text-muted">{d.openJobs.replace("{n}", String(jobs.length))}</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl" dir="auto">{c.about}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {facts.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>)}
          </dl>
          <a href={c.careersUrl} target="_blank" rel="noopener" className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:border-primary">{d.careers} <ExternalIcon /></a>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 md:grid-cols-2">
        {jobs.map((j) => <JobCard key={j.id} job={j} d={d} lang={lang} />)}
      </div>
    </>
  );
}
