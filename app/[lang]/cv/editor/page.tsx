import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getDict, type Locale } from "@/lib/i18n";
import { CvEditor } from "@/components/cv-editor";

export async function generateMetadata(props: PageProps<"/[lang]/cv/editor">): Promise<Metadata> {
  const { lang } = await props.params;
  const t = getDict(lang as Locale).cvEditor;
  return pageMeta(lang, "/cv/editor", t.seoTitle, t.seoDesc);
}

export default async function CvEditorPage(props: PageProps<"/[lang]/cv/editor">) {
  const lang = (await props.params).lang as Locale;
  return <CvEditor d={getDict(lang)} lang={lang} />;
}
