import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Moving guides: visa, Iqama & cost of living" };

const COST = [
  { city: "Dubai", cur: "AED", rent: 7500, transport: 600, food: 1800 },
  { city: "Riyadh", cur: "SAR", rent: 4500, transport: 900, food: 1600 },
  { city: "Doha", cur: "QAR", rent: 6500, transport: 700, food: 1700 },
  { city: "Bengaluru", cur: "INR", rent: 30000, transport: 4000, food: 12000 },
];

const GUIDES = [
  { title: "UAE work visa for developers", body: "Your employer applies for the entry permit, medical test and Emirates ID. Typical time: 2–4 weeks. The employer pays all visa costs by law.", tag: "UAE" },
  { title: "Saudi Iqama & Saudization", body: "Work visa is followed by an Iqama (residence permit). Some roles are reserved for Saudi nationals under Nitaqat quotas — look for the “Nationals preferred” label.", tag: "KSA" },
  { title: "Golden Visa for tech talent", body: "Senior engineers earning above the threshold or with recognised skills may qualify for a 10-year UAE Golden Visa, independent of employer.", tag: "UAE" },
  { title: "Moving from India to the Gulf", body: "Get degree certificates attested (MEA + embassy) before you resign. Check whether ECR clearance applies to your passport.", tag: "IN → GCC" },
];

export default async function Guides(props: PageProps<"/[lang]/guides">) {
  const d = getDict((await props.params).lang as Locale);
  const n = (x: number) => x.toLocaleString("en-US");
  return (
    <>
      <PageHeader title={d.guidesTitle} sub={d.guidesSub} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <div className="flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger"><ShieldIcon className="h-5 w-5 shrink-0" /><p>{d.scamWarn}</p></div>
        <div className="grid gap-3 md:grid-cols-2" dir="ltr" lang="en">
          {GUIDES.map((g) => (
            <article key={g.title} className="card p-5">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{g.tag}</span>
              <h2 className="mt-2 text-lg font-semibold">{g.title}</h2>
              <p className="mt-1 text-muted">{g.body}</p>
            </article>
          ))}
        </div>
        <section>
          <h2 className="text-xl font-semibold">{d.costTitle}</h2>
          <div className="mt-3 card overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr><th className="p-3 text-start">{d.city}</th><th className="p-3 text-start">{d.rent}</th><th className="p-3 text-start">{d.transport}</th><th className="p-3 text-start">{d.food}</th><th className="p-3 text-start">{d.total}</th></tr>
              </thead>
              <tbody dir="ltr">
                {COST.map((c) => (
                  <tr key={c.city} className="border-t border-line">
                    <td className="p-3 text-start font-medium">{c.city}</td>
                    <td className="p-3 text-start">{c.cur} {n(c.rent)}</td><td className="p-3 text-start">{c.cur} {n(c.transport)}</td><td className="p-3 text-start">{c.cur} {n(c.food)}</td>
                    <td className="p-3 text-start font-semibold">{c.cur} {n(c.rent + c.transport + c.food)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
