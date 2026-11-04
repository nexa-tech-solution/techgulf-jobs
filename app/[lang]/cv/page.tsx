import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import { CvMatch } from "@/components/cv-match";

export async function generateMetadata(props: PageProps<"/[lang]/cv">): Promise<Metadata> {
  const { lang } = await props.params;
  const s = getDict(lang as Locale).seo;
  return pageMeta(lang, "/cv", s.cvTitle, s.cvDesc);
}

export default async function Cv(props: PageProps<"/[lang]/cv">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const { jobs } = await getCatalog();
  return (
    <>
      <PageHeader title={d.cvTitle} sub={d.cvSub} />
      <div className="mx-auto max-w-6xl px-4 py-8"><CvMatch d={d} lang={lang} jobs={jobs} /></div>
    </>
  );
}
