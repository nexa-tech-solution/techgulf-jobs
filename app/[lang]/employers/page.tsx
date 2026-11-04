import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { PostJobForm } from "@/components/widgets";
import { CheckIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/[lang]/employers">): Promise<Metadata> {
  const { lang } = await props.params;
  const s = getDict(lang as Locale).seo;
  return pageMeta(lang, "/employers", s.employersTitle, s.employersDesc);
}

// Hidden until job posting and payments work. Set to true and restore the header link to bring it back.
const EMPLOYERS_ENABLED = false;

export default async function Employers(props: PageProps<"/[lang]/employers">) {
  if (!EMPLOYERS_ENABLED) notFound();
  const d = getDict((await props.params).lang as Locale);
  return (
    <>
      <PageHeader title={d.employersTitle} sub={d.employersSub}>
        <a href="#post" className="mt-5 inline-flex h-12 items-center rounded-lg bg-primary px-6 font-semibold text-on-primary">{d.postFree}</a>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-xl font-semibold md:text-2xl">{d.pricing}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {d.plans.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-2xl border bg-surface p-6 ${"highlight" in p && p.highlight ? "border-accent ring-2 ring-accent/30" : "border-line"}`}>
              <p className="font-semibold">{"highlight" in p && p.highlight && <span className="text-accent">★ </span>}{p.name}</p>
              <p className="mt-3"><span className="text-3xl font-bold" dir="ltr">{p.price}</span> <span className="text-sm text-muted">{p.unit}</span></p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.items.map((i) => <li key={i} className="flex gap-2"><CheckIcon className="h-4 w-4 shrink-0 text-success" />{i}</li>)}
              </ul>
              <a href="#post" className={`mt-6 inline-flex h-11 items-center justify-center rounded-lg font-semibold ${"highlight" in p && p.highlight ? "bg-primary text-on-primary" : "border border-line"}`}>{d.choose}</a>
            </div>
          ))}
        </div>
        <h2 id="post" className="mt-12 scroll-mt-20 text-xl font-semibold md:text-2xl">{d.postJob}</h2>
        <div className="mt-4"><PostJobForm d={d} /></div>
      </div>
    </>
  );
}
