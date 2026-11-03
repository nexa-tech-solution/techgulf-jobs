import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { GoogleSignIn } from "@/components/account";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login(props: PageProps<"/[lang]/login">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-line bg-surface p-8">
        <h1 className="text-2xl font-bold tracking-tight">{d.loginTitle}</h1>
        <p className="mt-1 text-muted">{d.loginSub}</p>
        <GoogleSignIn d={d} lang={lang} />
        <ul className="mt-8 space-y-2.5 border-t border-line pt-6 text-sm">
          {d.account.perks.map((p) => <li key={p} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />{p}</li>)}
        </ul>
      </div>
      <p className="mt-4 text-center text-xs text-muted">{d.terms}</p>
    </div>
  );
}
