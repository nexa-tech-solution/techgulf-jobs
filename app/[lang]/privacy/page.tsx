import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { PRIVACY } from "@/lib/privacy";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function Privacy(props: PageProps<"/[lang]/privacy">) {
  const content = PRIVACY[(await props.params).lang as Locale];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-[32px]">{content.title}</h1>
      <p className="mt-2 text-sm text-muted">{content.updated}</p>
      {content.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          <ul className="mt-3 list-disc space-y-2 ps-5">
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
