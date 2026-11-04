"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";

export default function JobNotFound() {
  const { lang } = useParams<{ lang: string }>();
  const locale = isLocale(lang) ? lang : "en";
  const d = getDict(locale);
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">{d.seo.jobGoneTitle}</h1>
      <p className="mt-2 text-muted">{d.seo.jobGoneSub}</p>
      <Link href={`/${locale}/jobs`} className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.seo.jobGoneCta}</Link>
    </div>
  );
}
