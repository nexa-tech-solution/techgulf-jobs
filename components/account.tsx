"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { actions, filterKey, useStore } from "@/lib/store";
import type { Dict, Locale } from "@/lib/i18n";
import type { JobFilters } from "@/lib/jobs";
import { describeFilters } from "@/lib/describe";
import { BellIcon, CheckIcon } from "./icons";

const nextParam = () => encodeURIComponent(location.pathname + location.search);

/** Header: "Sign in" when logged out, avatar menu when logged in. */
export function HeaderAccount({ d, lang }: { d: Dict; lang: Locale }) {
  const { user } = useStore();
  if (!user)
    return <Link href={`/${lang}/login`} className="hidden h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold hover:border-primary sm:inline-flex">{d.nav.login}</Link>;
  return (
    <details className="relative hidden sm:block">
      <summary className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-sm font-semibold text-on-primary" aria-label={user.email}>
        {user.name[0].toUpperCase()}
      </summary>
      <div className="absolute end-0 top-11 w-60 rounded-xl border border-line bg-surface p-2 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)]">
        <div className="px-3 py-2"><p className="text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div>
        <Link href={`/${lang}/saved`} className="flex h-10 items-center rounded-lg px-3 text-sm hover:bg-surface-2">{d.nav.saved}</Link>
        <Link href={`/${lang}/saved#alerts`} className="flex h-10 items-center rounded-lg px-3 text-sm hover:bg-surface-2">{d.account.myAlerts}</Link>
        <button onClick={() => actions.signOut()} className="flex h-10 w-full items-center rounded-lg px-3 text-sm text-danger hover:bg-surface-2">{d.account.signOut}</button>
      </div>
    </details>
  );
}

/** One-click "save this search" — the whole alert sign-up flow. */
export function SaveSearch({ d, lang, f, variant = "card" }: { d: Dict; lang: Locale; f: JobFilters; variant?: "card" | "button" }) {
  const { user, alerts } = useStore();
  const router = useRouter();
  const key = filterKey(f as Record<string, string>);
  const on = alerts.some((a) => a.key === key);
  const click = () => {
    if (!user) return router.push(`/${lang}/login?next=${nextParam()}`);
    if (on) actions.removeAlertByKey(key);
    else actions.saveSearch(f as Record<string, string>);
  };
  const btn = (
    <button type="button" onClick={click} aria-pressed={on}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${variant === "card" ? "w-full" : ""} ${on ? "border border-primary bg-primary/10 text-primary" : "bg-primary text-on-primary hover:opacity-90"}`}>
      {on ? <CheckIcon /> : <BellIcon className="h-4 w-4" />}{on ? d.account.alertOn : d.account.saveSearch}
    </button>
  );
  if (variant === "button") return btn;
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="font-semibold">{d.account.saveTitle}</p>
      <p className="mt-1 text-sm text-muted">{describeFilters(f, d)}</p>
      <div className="mt-4">{btn}</div>
      <p className="mt-3 text-xs text-muted">
        {on && user ? <>{d.account.sentTo.replace("{email}", user.email)} · <Link href={`/${lang}/saved#alerts`} className="text-primary hover:underline">{d.account.manage}</Link></> : d.account.saveHint}
      </p>
    </div>
  );
}

/** Social sign-in buttons (mocked until auth backend exists). */
export function SignInButtons({ d, lang }: { d: Dict; lang: Locale }) {
  const router = useRouter();
  const go = (provider: "google" | "linkedin" | "email", email = "rahul.dev@gmail.com") => {
    actions.signIn({ name: email.split(/[.@]/)[0].replace(/^./, (c) => c.toUpperCase()), email, provider });
    const next = new URLSearchParams(location.search).get("next");
    router.push(next && next.startsWith("/") ? next : `/${lang}/jobs`);
  };
  const btn = "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface font-semibold hover:border-ink/30";
  return (
    <>
      <div className="mt-6 space-y-3">
        <button type="button" onClick={() => go("google")} className={btn}><span className="font-bold text-[#4285f4]">G</span>{d.withGoogle}</button>
        <button type="button" onClick={() => go("linkedin")} className={btn}><span className="rounded bg-[#0a66c2] px-1 text-xs font-bold text-white">in</span>{d.withLinkedIn}</button>
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />{d.orEmail}<span className="h-px flex-1 bg-line" /></div>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); go("email", String(new FormData(e.currentTarget).get("email"))); }}>
        <input name="email" type="email" required dir="ltr" placeholder="you@example.com" aria-label={d.email}
          className="h-11 w-full rounded-lg border border-line bg-surface px-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
        <button className="h-12 w-full rounded-lg bg-primary font-semibold text-on-primary">{d.continue}</button>
      </form>
    </>
  );
}
