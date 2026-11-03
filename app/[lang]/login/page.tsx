import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { SignInButtons } from "@/components/account";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login(props: PageProps<"/[lang]/login">) {
  const lang = (await props.params).lang as Locale;
  const d = getDict(lang);
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{d.loginTitle}</h1>
        <p className="mt-1 text-muted">{d.loginSub}</p>
        <SignInButtons d={d} lang={lang} />
        <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
          {d.account.perks.map((p) => <li key={p} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />{p}</li>)}
        </ul>
        <p className="mt-4 text-xs text-muted">{d.terms}</p>
      </div>
    </div>
  );
}
