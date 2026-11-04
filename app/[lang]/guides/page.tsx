import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getGuidesContent } from "@/lib/catalog";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { GuidesHub } from "@/components/guides";

export async function generateMetadata(props: PageProps<"/[lang]/guides">): Promise<Metadata> {
  const { lang } = await props.params;
  const s = getDict(lang as Locale).seo;
  return pageMeta(lang, "/guides", s.guidesTitle, s.guidesDesc);
}

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
