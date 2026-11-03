import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n";
import type { JobFilters } from "@/lib/jobs";
import { CATEGORIES, COUNTRY_CODES } from "@/lib/format";
import { FilterIcon, SearchIcon } from "./icons";
import { inputCls } from "./ui";

const Opt = ({ name, label, f }: { name: keyof JobFilters; label: string; f: JobFilters }) => (
  <label className="flex min-h-11 items-center gap-3 text-sm">
    <input type="checkbox" name={name} value="1" defaultChecked={f[name] === "1"} className="h-4 w-4 accent-[var(--primary)]" />
    {label}
  </label>
);

export function SearchBar({ d, f, lang, big }: { d: Dict; f: JobFilters; lang: Locale; big?: boolean }) {
  return (
    <form action={`/${lang}/jobs`} className={`flex gap-2 ${big ? "flex-col sm:flex-row" : ""}`}>
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-muted" />
        <input name="q" defaultValue={f.q} placeholder={d.searchPlaceholder} aria-label={d.search} className={`${inputCls} h-12 ps-10`} />
      </div>
      {big && (
        <select name="country" defaultValue={f.country ?? ""} className={`${inputCls} h-12 sm:w-48`} aria-label={d.anywhere}>
          <option value="">{d.anywhere}</option>
          {COUNTRY_CODES.map((c) => <option key={c} value={c}>{d.country[c]}</option>)}
        </select>
      )}
      <button className="h-12 rounded-lg bg-primary px-6 font-semibold text-on-primary">{d.search}</button>
    </form>
  );
}

export function FilterPanel({ d, f, lang }: { d: Dict; f: JobFilters; lang: Locale }) {
  const body = (
    <div className="space-y-4">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      <Field label={d.anywhere}>
        <select name="country" defaultValue={f.country ?? ""} className={inputCls}>
          <option value="">{d.anywhere}</option>
          {COUNTRY_CODES.map((c) => <option key={c} value={c}>{d.country[c]}</option>)}
        </select>
      </Field>
      <Field label={d.allFields}>
        <select name="category" defaultValue={f.category ?? ""} className={inputCls}>
          <option value="">{d.allFields}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{d.category[c]}</option>)}
        </select>
      </Field>
      <Field label={d.anyMode}>
        <select name="mode" defaultValue={f.mode ?? ""} className={inputCls}>
          <option value="">{d.anyMode}</option>
          {(["remote", "hybrid", "onsite"] as const).map((m) => <option key={m} value={m}>{d.mode[m]}</option>)}
        </select>
      </Field>
      <Field label={d.anyLevel}>
        <select name="seniority" defaultValue={f.seniority ?? ""} className={inputCls}>
          <option value="">{d.anyLevel}</option>
          {(["intern", "junior", "mid", "senior", "lead"] as const).map((m) => <option key={m} value={m}>{d.level[m]}</option>)}
        </select>
      </Field>
      <Field label={d.anyTime}>
        <select name="posted" defaultValue={f.posted ?? ""} className={inputCls}>
          <option value="">{d.anyTime}</option>
          {["1", "7", "30"].map((n) => <option key={n} value={n}>{d.last.replace("{n}", n)}</option>)}
        </select>
      </Field>
      <div className="border-t border-line pt-2">
        <Opt name="visa" label={d.visa} f={f} />
        <Opt name="salary" label={d.salaryDisclosed} f={f} />
        <Opt name="direct" label={d.direct} f={f} />
        <Opt name="nationals" label={d.nationals} f={f} />
      </div>
      <div className="flex gap-2">
        <button className="h-11 flex-1 rounded-lg bg-primary font-semibold text-on-primary">{d.apply}</button>
        <Link href={`/${lang}/jobs`} className="inline-flex h-11 items-center rounded-lg px-3 text-sm text-muted hover:text-ink">{d.clear}</Link>
      </div>
    </div>
  );
  return (
    <form action={`/${lang}/jobs`}>
      {/* Mobile: collapsible, no JS needed */}
      <details className="card lg:hidden">
        <summary className="flex h-12 cursor-pointer items-center gap-2 px-4 font-medium"><FilterIcon />{d.filters}</summary>
        <div className="border-t border-line p-4">{body}</div>
      </details>
      <div className="card hidden p-4 lg:block">{body}</div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="sr-only">{label}</span>{children}</label>;
}
