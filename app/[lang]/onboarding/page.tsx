import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/catalog";
import { Onboarding } from "@/components/onboarding";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default async function OnboardingPage(props: PageProps<"/[lang]/onboarding">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  const { jobs } = await getCatalog();
  // Employer keywords, so typed skills use the same spelling that job matching compares against
  const skills = [...new Set(jobs.flatMap((job) => job.tags))].sort((a, b) => a.localeCompare(b));
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[28px] font-bold tracking-tight">{d.onboard.title}</h1>
      <p className="mt-1 text-muted">{d.onboard.sub}</p>
      <div className="mt-8"><Onboarding d={d} lang={lang} skills={skills} /></div>
    </div>
  );
}
