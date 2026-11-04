import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDict, type Locale } from "@/lib/i18n";
import { coverOf } from "@/lib/blog";
import { getPosts } from "@/lib/catalog";
import { orSample, pageMeta } from "@/lib/seo";
import { Tag } from "@/components/ui";
import { BackIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const post = (await getPosts()).find((p) => p.slug === slug);
  if (!post) return {};
  const meta = pageMeta(lang, `/blog/${slug}`, post.title, post.summary);
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", images: [coverOf(post)] } };
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return orSample(posts.map((p) => ({ slug: p.slug })), { slug: "sample" });
}

export default async function BlogPost(props: PageProps<"/[lang]/blog/[slug]">) {
  const { slug } = await props.params;
  // Before Suspense: once streaming starts, the response can no longer become a real 404.
  if (!(await getPosts()).some((p) => p.slug === slug)) notFound();
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8"><div className="h-[480px] animate-pulse rounded-2xl bg-surface" /></div>}>
      <PostBody params={props.params} />
    </Suspense>
  );
}

async function PostBody({ params }: { params: PageProps<"/[lang]/blog/[slug]">["params"] }) {
  const { lang: l, slug } = await params;
  const lang = l as Locale;
  const d = getDict(lang);
  const posts = await getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const more = posts.filter((p) => p.slug !== slug).slice(0, 3);
  const date = new Date(post.date).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/${lang}/blog`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><BackIcon /> {d.blogPage.back}</Link>
      <article className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-semibold uppercase tracking-wide text-primary">{d.blogPage.cat[post.category]}</span>
          {post.hot && <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-semibold text-red-600 dark:text-red-400">{d.blogPage.hot}</span>}
          <span aria-hidden>·</span><span>{date}</span>
        </div>
        <div dir="ltr" lang="en" className="text-start">
          <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight md:text-[38px]">{post.title}</h1>
          <p className="mt-3 text-lg text-muted">{post.summary}</p>
          <p className="mt-4 text-sm text-muted">{post.author}</p>
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-2">
            <Image src={coverOf(post)} alt={post.coverAlt} fill priority sizes="(min-width: 768px) 736px, 100vw" className="object-cover" />
          </div>
          <div className="mt-8 space-y-4 pt-4 leading-7">
            {post.body.map((b, i) =>
              b.startsWith("## ") ? <h2 key={i} className="pt-4 text-xl font-semibold">{b.slice(3)}</h2>
              : b.startsWith("- ") ? <p key={i} className="flex gap-3 ps-1"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{b.slice(2)}</p>
              : <p key={i}>{b}</p>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">{post.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        </div>
      </article>
      <section className="mt-12 border-t border-line pt-6">
        <h2 className="font-semibold">{d.blogPage.more}</h2>
        <div className="mt-2">
          {more.map((p) => (
            <Link key={p.slug} href={`/${lang}/blog/${p.slug}`} dir="ltr" className="group flex items-center gap-4 border-b border-line py-3 text-start">
              <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2"><Image src={coverOf(p)} alt="" fill sizes="96px" className="object-cover" /></span>
              <span className="font-medium group-hover:text-primary">{p.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
