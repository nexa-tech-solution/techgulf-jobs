import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { JOBS } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui";
import { CvMatch } from "@/components/cv-match";

export const metadata: Metadata = { title: "Skill match" };

export default async function Cv(props: PageProps<"/[lang]/cv">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  return (
    <>
      <PageHeader title={d.cvTitle} sub={d.cvSub} />
      <div className="mx-auto max-w-6xl px-4 py-8"><CvMatch d={d} lang={lang} jobs={JOBS} /></div>
    </>
  );
}
