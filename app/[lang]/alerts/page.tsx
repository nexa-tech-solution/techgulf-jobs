import type { Metadata } from "next";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { AlertForm } from "@/components/widgets";

export const metadata: Metadata = { title: "Job alerts" };

export default async function Alerts(props: PageProps<"/[lang]/alerts">) {
  const d = getDict((await props.params).lang as Locale);
  return (
    <>
      <PageHeader title={d.alertsTitle} sub={d.alertsSub} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<AlertForm d={d} initial={{}} />}><Prefilled d={d} sp={props.searchParams} /></Suspense>
      </div>
    </>
  );
}

async function Prefilled({ d, sp }: { d: ReturnType<typeof getDict>; sp: PageProps<"/[lang]/alerts">["searchParams"] }) {
  const s = await sp;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return <AlertForm d={d} initial={{ q: one(s.q), country: one(s.country), category: one(s.category) }} />;
}
