import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { GuidesHub } from "@/components/guides";

export const metadata: Metadata = { title: "Moving guides: visa, Iqama & cost of living" };

export default async function Guides(props: PageProps<"/[lang]/guides">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  return (
    <>
      <PageHeader title={d.guidesTitle} sub={d.guidesSub} />
      <div className="mx-auto max-w-6xl px-4 py-8"><GuidesHub d={d} lang={lang} /></div>
    </>
  );
}
