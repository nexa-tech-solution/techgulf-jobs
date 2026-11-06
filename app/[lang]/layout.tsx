import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import { LOCALES, getDict, isLocale } from "@/lib/i18n";
import { BLOG_ENABLED } from "@/lib/blog";
import { SITE_URL, jsonLd } from "@/lib/seo";
import { CloseMenus, LangSwitch, SearchHotkey, ThemeScript, ThemeToggle } from "@/components/client";
import { AuthSync, HeaderAccount } from "@/components/account";
import { FirebaseAnalytics } from "@/components/firebase-analytics";
import { FacebookIcon, LinkedInIcon, MenuIcon, XIcon } from "@/components/icons";
import { SOCIAL_LINKS } from "@/lib/social.mjs";
import "../globals.css";

const SOCIAL_ICONS = { facebook: FacebookIcon, linkedin: LinkedInIcon, x: XIcon };

const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexArabic = IBM_Plex_Sans_Arabic({ variable: "--font-plex-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"], preload: false });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500"], preload: false });

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export async function generateMetadata(props: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  const d = getDict(isLocale(lang) ? lang : "en");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `TechGulf Jobs — ${d.heroTitle}`, template: "%s · TechGulf Jobs" },
    description: d.heroSub,
  };
}

// Applies saved theme before paint to avoid a flash
const themeScript = `try{var t=localStorage.getItem("tgj:theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function LangLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  const d = getDict(lang);
  const nav = [
    ["jobs", d.nav.jobs], ["companies", d.nav.companies], ["salaries", d.nav.salaries],
    ["guides", d.nav.guides], ...(BLOG_ENABLED ? [["blog", d.nav.blog] as const] : []), ["cv", d.nav.cv], ["cv/editor", d.cvEditor.title],
  ] as const;

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} suppressHydrationWarning
      className={`${plexSans.variable} ${plexArabic.variable} ${plexMono.variable} h-full antialiased`}>
      <head>
        <ThemeScript code={themeScript} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([
          { "@context": "https://schema.org", "@type": "Organization", name: "TechGulf Jobs", url: SITE_URL, logo: `${SITE_URL}/logo.png`, sameAs: SOCIAL_LINKS.map((s) => s.url) },
          { "@context": "https://schema.org", "@type": "WebSite", name: "TechGulf Jobs", url: SITE_URL, inLanguage: lang,
            potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/${lang}/jobs?q={search_term_string}`, "query-input": "required name=search_term_string" } },
        ]) }} />
      </head>
      <body className="flex min-h-full flex-col">
        <FirebaseAnalytics />
        <Analytics />
        <AuthSync />
        <SearchHotkey />
        <CloseMenus />
        <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
            <Link href={`/${lang}`} className="me-4 text-[17px] font-bold tracking-tight" dir="ltr">techgulf<span className="text-primary">.</span>jobs</Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {nav.map(([href, label]) => (
                <Link key={href} href={`/${lang}/${href}`} className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-ink">{label}</Link>
              ))}
            </nav>
            <div className="ms-auto flex items-center">
              {/* usePathname is only known at request time on runtime-rendered routes */}
              <Suspense fallback={<span className="inline-flex h-11 items-center px-3 text-sm font-medium text-muted">{d.language}</span>}>
                <LangSwitch label={d.language} />
              </Suspense>
              <ThemeToggle label={d.theme} />
              <Link href={`/${lang}/saved`} className="hidden h-11 items-center rounded-lg px-3 text-sm font-medium text-muted hover:text-ink sm:inline-flex">{d.nav.saved}</Link>
              <HeaderAccount d={d} lang={lang} />
              <details data-menu className="relative lg:hidden">
                <summary className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg text-muted" aria-label="Menu"><MenuIcon /></summary>
                <div className="card absolute end-0 top-12 w-60 p-2">
                  {[...nav, ["saved", d.nav.saved], ["login", d.nav.login]].map(([href, label]) => (
                    <Link key={href} href={`/${lang}/${href}`} className="flex h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-surface-2">{label}</Link>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="flex-1">{props.children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-bold" dir="ltr">techgulf<span className="text-primary">.</span>jobs</p>
              <p className="mt-2 text-muted">{d.brandTag}</p>
              <p className="mt-4 font-medium">{d.followUs}</p>
              <ul className="mt-1 -ms-3 flex">
                {SOCIAL_LINKS.map(({ id, label, url }) => {
                  const Icon = SOCIAL_ICONS[id as keyof typeof SOCIAL_ICONS];
                  return (
                    <li key={id}>
                      <a href={url} target="_blank" rel="noopener me" aria-label={label} title={label} className="grid h-11 w-11 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"><Icon /></a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              {nav.map(([href, label]) => <Link key={href} href={`/${lang}/${href}`} className="text-muted hover:text-ink">{label}</Link>)}
            </div>
            <div>
              <p className="text-muted">{d.footerNote}</p>
              <Link href={`/${lang}/privacy`} className="mt-2 inline-block text-muted hover:text-ink">{d.onboard.privacyLink}</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
