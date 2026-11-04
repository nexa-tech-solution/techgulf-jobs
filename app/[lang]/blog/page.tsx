import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { BLOG_CATEGORIES, coverOf, type Post } from "@/lib/blog";
import { getPosts } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import type { Dict } from "@/lib/i18n";

export async function generateMetadata(props: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = await props.params;
  const s = getDict(lang as Locale).seo;
  return pageMeta(lang, "/blog", s.blogTitle, s.blogDesc);
}

const fmt = (d: string, lang: Locale) => new Date(d).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

function Meta({ p, d, lang }: { p: Post; d: Dict; lang: Locale }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="font-semibold uppercase tracking-wide text-primary">{d.blogPage.cat[p.category]}</span>
      {p.hot && <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-semibold text-red-600 dark:text-red-400">{d.blogPage.hot}</span>}
      <span aria-hidden>·</span><span>{fmt(p.date, lang)}</span>
    </div>
  );
}

export default async function Blog(props: PageProps<"/[lang]/blog">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  return (
    <>
      <PageHeader title={d.blogTitle} sub={d.blogSub} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface" />}>
          <PostList lang={lang} d={d} searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function PostList({ lang, d, searchParams }: { lang: Locale; d: Dict; searchParams: PageProps<"/[lang]/blog">["searchParams"] }) {
  const c = (await searchParams).cat;
  const cat = Array.isArray(c) ? c[0] : c;
  const posts = await getPosts();
  const list = posts.filter((p) => !cat || p.category === cat);
  const [lead, ...rest] = list;
  const tabs: [string, string][] = [["", d.blogPage.all], ...BLOG_CATEGORIES.map((k): [string, string] => [k, d.blogPage.cat[k]])];

  return (
    <>
        <nav className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
          {tabs.map(([k, label]) => {
            const active = (cat ?? "") === k;
            return (
              <Link key={k || "all"} href={k ? `/${lang}/blog?cat=${k}` : `/${lang}/blog`} aria-current={active ? "page" : undefined}
                className={`-mb-px h-11 shrink-0 border-b-2 px-4 pt-3 text-sm font-medium transition ${active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>
                {label} <span className="text-muted">{posts.filter((p) => !k || p.category === k).length}</span>
              </Link>
            );
          })}
        </nav>

        {!lead ? <p className="py-16 text-center text-muted">{d.blogPage.empty}</p> : (
          <>
            <Link href={`/${lang}/blog/${lead.slug}`} className="group mt-6 grid overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-ink/25 md:grid-cols-[1.4fr_1fr]">
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-2 md:aspect-auto md:min-h-80">
                <Image src={coverOf(lead)} alt={lead.coverAlt} fill priority sizes="(min-width: 768px) 640px, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="flex flex-col justify-center p-6 md:p-8">
              <Meta p={lead} d={d} lang={lang} />
              <h2 dir="ltr" className="mt-3 text-start text-2xl font-bold leading-tight tracking-tight group-hover:text-primary md:text-3xl">{lead.title}</h2>
              <p dir="ltr" className="mt-3 max-w-2xl text-start text-muted">{lead.summary}</p>
              </div>
            </Link>
            <div className="mt-8 grid gap-x-8 md:grid-cols-2">
              {rest.map((p) => (
                <Link key={p.slug} href={`/${lang}/blog/${p.slug}`} className="group flex flex-col gap-4 border-t border-line py-5 sm:flex-row">
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-44">
                    <Image src={coverOf(p)} alt={p.coverAlt} fill sizes="(min-width: 640px) 176px, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="min-w-0">
                  <Meta p={p} d={d} lang={lang} />
                  <h3 dir="ltr" className="mt-2 text-start text-lg font-semibold leading-snug group-hover:text-primary">{p.title}</h3>
                  <p dir="ltr" className="mt-1.5 text-start text-sm text-muted">{p.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
    </>
  );
}
