import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { getMarketData } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import { SalaryDashboard } from "@/components/salaries";

export async function generateMetadata(props: PageProps<"/[lang]/salaries">): Promise<Metadata> {
  const { lang } = await props.params;
  const s = getDict(lang as Locale).seo;
  return pageMeta(lang, "/salaries", s.salariesTitle, s.salariesDesc);
}

export default async function Salaries(props: PageProps<"/[lang]/salaries">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const market = await getMarketData();
  if (!market) notFound();
  const updated = new Date(market.updatedAt).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <>
      <PageHeader title={d.salariesTitle} sub={d.salariesSub}>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {market.benchmarks.length > 0 && (
            <p className="inline-flex flex-wrap items-center gap-x-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="font-medium">{d.salary.updated} {updated}</span>
              <span className="text-muted">· {d.salary.sample.replace("{n}", market.sampleSize.toLocaleString("en-US"))}</span>
            </p>
          )}
          <Link href={`/${lang}/salaries/contribute`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">{d.contribute.cta}</Link>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-8"><SalaryDashboard d={d} lang={lang} market={market} /></div>
    </>
  );
}
