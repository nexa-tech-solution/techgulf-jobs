import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { SalaryReportForm } from "@/components/salary-report";

export const metadata: Metadata = { title: "Share your salary", robots: { index: false } };

export default async function ContributeSalary(props: PageProps<"/[lang]/salaries/contribute">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const { cities } = await getCatalog();
  return (
    <>
      <PageHeader title={d.contribute.title} sub={d.contribute.sub} />
      <div className="mx-auto max-w-xl px-4 py-8"><SalaryReportForm d={d} lang={lang} cities={cities} /></div>
    </>
  );
}
