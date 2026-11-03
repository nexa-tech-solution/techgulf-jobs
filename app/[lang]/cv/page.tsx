import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { JOBS } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui";
import { CvMatch } from "@/components/widgets";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "CV match" };

export default async function Cv(props: PageProps<"/[lang]/cv">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  return (
    <>
      <PageHeader title={d.cvTitle} sub={d.cvSub} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <CvMatch d={d} lang={lang} jobs={JOBS} />
        <aside className="rounded-xl border border-accent/50 bg-accent/5 p-5 lg:self-start">
          <p className="text-sm font-semibold text-accent">★ {d.premium}</p>
          <p className="mt-2">{d.premiumSub}</p>
          <p className="mt-3 text-sm font-semibold">{d.premiumPrice}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {["AI CV builder (ATS-ready)", "Mock interview", "Advanced match", "Salary insights"].map((x) => <li key={x} className="flex gap-2"><CheckIcon className="h-4 w-4 text-success" />{x}</li>)}
          </ul>
        </aside>
      </div>
    </>
  );
}
