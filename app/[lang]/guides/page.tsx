import type { Metadata } from "next";
import { getGuidesContent } from "@/lib/catalog";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { GuidesHub } from "@/components/guides";

export const metadata: Metadata = { title: "Career guides for developers: CV, interviews, salary & visas" };

export default async function Guides(props: PageProps<"/[lang]/guides">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const content = await getGuidesContent(lang);
  return (
    <>
      <PageHeader title={d.guidesTitle} sub={d.guidesSub} />
      <div className="mx-auto max-w-6xl px-4 py-8">{content ? <GuidesHub d={d} lang={lang} content={content} /> : <p className="py-12 text-center text-muted">{d.noResults}</p>}</div>
    </>
  );
}
