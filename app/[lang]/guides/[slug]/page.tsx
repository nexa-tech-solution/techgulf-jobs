import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGuidesContent } from "@/lib/catalog";
import { orSample, pageMeta } from "@/lib/seo";
import { getDict, type Locale } from "@/lib/i18n";
import { CareerBlockView, GuideCover } from "@/components/career-guides";
import { BackIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/[lang]/guides/[slug]">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const guide = (await getGuidesContent(lang))?.career?.find((g) => g.slug === slug);
  return guide ? pageMeta(lang, `/guides/${slug}`, guide.title, guide.summary) : {};
}

export async function generateStaticParams() {
  const content = await getGuidesContent("en");
  return orSample((content?.career ?? []).map((g) => ({ slug: g.slug })), { slug: "sample" });
}

export default async function CareerGuidePage(props: PageProps<"/[lang]/guides/[slug]">) {
  const { lang, slug } = await props.params;
  // Before Suspense: once streaming starts, the response can no longer become a real 404.
  if (!(await getGuidesContent(lang))?.career?.some((g) => g.slug === slug)) notFound();
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-4xl animate-pulse px-4 py-6" />}>
      <Guide params={props.params} />
    </Suspense>
  );
}

async function Guide({ params }: Pick<PageProps<"/[lang]/guides/[slug]">, "params">) {
  const { lang: l, slug } = await params;
  const lang = l as Locale;
  const d = getDict(lang);
  const content = await getGuidesContent(lang);
  const guide = content?.career?.find((g) => g.slug === slug);
  if (!guide) notFound();
  const more = content!.career!.filter((g) => g.slug !== slug).slice(0, 3);
  return (
    <article className="mx-auto max-w-4xl px-4 py-6">
      <Link href={`/${lang}/guides`} className="inline-flex h-11 items-center gap-1 text-sm text-primary"><BackIcon />{d.nav.guides}</Link>
      <div>
        <div className="mt-2 aspect-[32/10] overflow-hidden rounded-2xl border border-line"><GuideCover kind={guide.cover} /></div>
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{guide.title}</h1>
        <p className="mt-2 text-lg text-muted">{guide.summary}</p>
        <p className="mt-2 text-sm text-muted">{new Date(guide.updated).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="mt-10 space-y-12">{guide.blocks.map((b, i) => <CareerBlockView key={i} block={b} d={d} />)}</div>
      </div>
      <section className="mt-14 border-t border-line pt-8">
        <h2 className="text-xl font-semibold">{d.guidesPage.moreGuides}</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {more.map((g) => (
            <li key={g.slug}><Link href={`/${lang}/guides/${g.slug}`} className="block overflow-hidden rounded-xl border border-line bg-surface transition hover:border-ink/30">
              <div className="aspect-[32/14]"><GuideCover kind={g.cover} /></div><p className="p-3 text-sm font-semibold">{g.title}</p>
            </Link></li>
          ))}
        </ul>
      </section>
    </article>
  );
}
