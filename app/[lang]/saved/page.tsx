import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import { MyJobs } from "@/components/widgets";

export const metadata: Metadata = { title: "My jobs", robots: { index: false } };

export default async function Saved(props: PageProps<"/[lang]/saved">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const { jobs } = await getCatalog();
  return (<><PageHeader title={d.myJobsTitle} /><div className="mx-auto max-w-6xl px-4 py-6"><MyJobs d={d} lang={lang} jobs={jobs} /></div></>);
}
