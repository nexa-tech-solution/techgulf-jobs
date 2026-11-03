import type { Dict, Locale } from "@/lib/i18n";
import type { JobFilters } from "@/lib/jobs";
import { COUNTRY_CODES } from "@/lib/format";
import { SearchIcon } from "./icons";
import { inputCls } from "./ui";
import { Select } from "./select";

export function SearchBar({ d, f, lang, big }: { d: Dict; f: JobFilters; lang: Locale; big?: boolean }) {
  return (
    <form action={`/${lang}/jobs`} className={`flex gap-2 ${big ? "flex-col sm:flex-row" : ""}`}>
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-muted" />
        <input name="q" defaultValue={f.q} placeholder={d.searchPlaceholder} aria-label={d.search} className={`${inputCls} h-12 ps-10`} />
      </div>
      {big && (
        <Select name="country" defaultValue={f.country ?? ""} placeholder={d.anywhere} className="sm:w-52 [&>button]:h-12"
          options={[{ value: "", label: d.anywhere }, ...COUNTRY_CODES.map((c) => ({ value: c, label: d.country[c] }))]} />
      )}
      {!big && Object.entries(f).filter(([k, v]) => k !== "q" && v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className="h-12 rounded-lg bg-primary px-6 font-semibold text-on-primary">{d.search}</button>
    </form>
  );
}
