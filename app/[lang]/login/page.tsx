import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { inputCls } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login(props: PageProps<"/[lang]/login">) {
  const d = getDict((await props.params).lang as Locale);
  const btn = "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface font-semibold hover:border-primary";
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{d.loginTitle}</h1>
        <p className="mt-1 text-muted">{d.loginSub}</p>
        <div className="mt-6 space-y-3">
          <button className={btn}><span className="font-bold text-[#4285f4]">G</span>{d.withGoogle}</button>
          <button className={btn}><span className="rounded bg-[#0a66c2] px-1 text-xs font-bold text-white">in</span>{d.withLinkedIn}</button>
        </div>
        <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />{d.orEmail}<span className="h-px flex-1 bg-line" /></div>
        <form className="space-y-3">
          <input type="email" required dir="ltr" placeholder="you@example.com" aria-label={d.email} className={inputCls} />
          <button className="h-12 w-full rounded-lg bg-primary font-semibold text-on-primary">{d.continue}</button>
        </form>
        <p className="mt-4 text-xs text-muted">{d.terms}</p>
      </div>
    </div>
  );
}
