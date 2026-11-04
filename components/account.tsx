"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { actions, filterKey, getStoreState, useStore } from "@/lib/store";
import type { Dict, Locale } from "@/lib/i18n";
import type { JobFilters } from "@/lib/jobs";
import { describeFilters } from "@/lib/describe";
import { BellIcon, CheckIcon } from "./icons";

const nextParam = () => encodeURIComponent(location.pathname + location.search);

const signOutEverywhere = async () => {
  try {
    const { signOutOfGoogle } = await import("@/lib/auth");
    await signOutOfGoogle();
    actions.signOut();
  } catch (error) {
    console.error("Sign-out failed", error);
  }
};

/** Header: "Sign in" when logged out, avatar menu when logged in. */
export function HeaderAccount({ d, lang }: { d: Dict; lang: Locale }) {
  const { user } = useStore();
  if (!user)
    return <Link href={`/${lang}/login`} className="hidden h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold hover:border-primary sm:inline-flex">{d.nav.login}</Link>;
  return (
    <details data-menu className="relative hidden sm:block">
      <summary className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-sm font-semibold text-on-primary" aria-label={user.email}>
        {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
      </summary>
      <div className="absolute end-0 top-11 w-60 rounded-xl border border-line bg-surface p-2 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)]">
        <div className="px-3 py-2"><p className="text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div>
        <Link href={`/${lang}/onboarding`} className="flex h-10 items-center rounded-lg px-3 text-sm hover:bg-surface-2">{d.onboard.editProfile}</Link>
        <Link href={`/${lang}/saved`} className="flex h-10 items-center rounded-lg px-3 text-sm hover:bg-surface-2">{d.nav.saved}</Link>
        <Link href={`/${lang}/saved#alerts`} className="flex h-10 items-center rounded-lg px-3 text-sm hover:bg-surface-2">{d.account.myAlerts}</Link>
        <button onClick={signOutEverywhere} className="flex h-10 w-full items-center rounded-lg px-3 text-sm text-danger hover:bg-surface-2">{d.account.signOut}</button>
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

/** Keeps the store in step with the Firebase session. Auth code loads after mount to stay out of the initial bundle. */
export function AuthSync() {
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    Promise.all([import("@/lib/auth"), import("@/lib/cloud-sync")])
      .then(([{ watchAuth }, { startCloudSync, stopCloudSync }]) => {
        if (!active) return;
        unsubscribe = watchAuth((user) => {
          actions.syncAuth(user);
          if (user) startCloudSync(user.uid).catch((error) => console.warn("Cloud sync failed", error));
          else stopCloudSync();
        });
      })
      .catch((error) => console.warn("Firebase Auth failed to load", error));
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  return null;
}

// The user chose not to finish signing in, so there is nothing to report
const CANCELLED = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

/** Google-only sign-in. First sign-in goes to profile setup. */
export function GoogleSignIn({ d, lang }: { d: Dict; lang: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const go = async () => {
    setPending(true);
    setFailed(false);
    try {
      const [{ signInWithGoogle }, { startCloudSync }] = await Promise.all([import("@/lib/auth"), import("@/lib/cloud-sync")]);
      const user = await signInWithGoogle();
      actions.syncAuth(user);
      // Wait for the account's profile, so returning users on a new device skip onboarding
      await startCloudSync(user.uid).catch((error) => console.warn("Cloud sync failed", error));
      const raw = new URLSearchParams(location.search).get("next");
      // Only same-site paths: "//host" and "/\host" would leave the site
      const next = raw && /^\/(?![/\\])/.test(raw) ? raw : `/${lang}/jobs`;
      router.push(getStoreState().profile ? next : `/${lang}/onboarding?next=${encodeURIComponent(next)}`);
    } catch (error) {
      if (!CANCELLED.includes((error as { code?: string }).code ?? "")) {
        console.error("Google sign-in failed", error);
        setFailed(true);
      }
    } finally {
      setPending(false);
    }
  };
  return (
    <>
    {failed && <p role="alert" className="mt-8 -mb-4 text-sm text-danger">{d.account.signInError}</p>}
    <button type="button" onClick={go} disabled={pending}
      className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface font-semibold transition hover:border-ink/30 hover:bg-surface-2 disabled:opacity-60">
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {d.withGoogle}
    </button>
    </>
  );
}
