import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { SALARY_SAMPLE, SALARY_UPDATED } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui";
import { SalaryDashboard } from "@/components/salaries";

export const metadata: Metadata = { title: "Tech salaries in Dubai, Riyadh & Bengaluru (Nov 2026)" };

export default async function Salaries(props: PageProps<"/[lang]/salaries">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const updated = new Date(SALARY_UPDATED).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <>
      <PageHeader title={d.salariesTitle} sub={d.salariesSub}>
        <p className="mt-4 inline-flex flex-wrap items-center gap-x-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span className="font-medium">{d.salary.updated} {updated}</span>
          <span className="text-muted">· {d.salary.sample.replace("{n}", SALARY_SAMPLE.toLocaleString("en-US"))}</span>
        </p>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-8"><SalaryDashboard d={d} lang={lang} /></div>
    </>
  );
}
