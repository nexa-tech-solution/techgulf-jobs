import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { SalaryExplorer } from "@/components/widgets";

export const metadata: Metadata = { title: "Tech salaries in Dubai, Riyadh & Bengaluru (2026)" };

export default async function Salaries(props: PageProps<"/[lang]/salaries">) {
  const d = getDict((await props.params).lang as Locale);
  return (<><PageHeader title={d.salariesTitle} sub={d.salariesSub} /><div className="mx-auto max-w-6xl px-4 py-6"><SalaryExplorer d={d} /></div></>);
}
