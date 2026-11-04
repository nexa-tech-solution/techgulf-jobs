import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.techgulf-jobs.com").replace(/\/$/, "");
export const LANGS = ["en", "ar"] as const;

/** Title, description, canonical and hreflang for a page. `path` has no language prefix: "/jobs", or "" for home. */
export function pageMeta(lang: string, path: string, title: string, description: string, noindex = false): Metadata {
  const image = `/${lang}/opengraph-image`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}${path}`,
      languages: { en: `/en${path}`, ar: `/ar${path}`, "x-default": `/en${path}` },
    },
    openGraph: { title, description, url: `/${lang}${path}`, siteName: "TechGulf Jobs", type: "website", locale: lang === "ar" ? "ar_AE" : "en_US", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

/** Safe to place inside a script tag. */
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export const breadcrumbs = (items: [string, string][]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path}` })),
});

/** Search results want a short snippet, not a whole job description. */
export function snippet(text: string, max = 155) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).replace(/\s\S*$/, "")}…`;
}

/** Cache Components needs at least one sample param to validate a route at build time. */
export const orSample = <T extends object>(params: T[], sample: T) => (params.length ? params : [sample]);
