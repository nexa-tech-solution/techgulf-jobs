import type { Metadata } from "next";
import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { COMPANIES } from "@/lib/mock-data";
import { jobsByCompany } from "@/lib/jobs";
import { Logo, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Companies" };

export default async function Companies(props: PageProps<"/[lang]/companies">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const list = COMPANIES.filter((c) => c.ats !== "direct").sort((a, b) => jobsByCompany(b.slug).length - jobsByCompany(a.slug).length);
  return (
    <>
      <PageHeader title={d.companiesTitle} />
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Link key={c.slug} href={`/${lang}/companies/${c.slug}`} className="flex gap-3 card card-hover p-4">
            <Logo company={c} />
            <div className="min-w-0">
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-muted">{c.industry} · {c.hq}</p>
              <p className="mt-1 text-sm font-medium text-primary">{d.openJobs.replace("{n}", String(jobsByCompany(c.slug).length))}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
