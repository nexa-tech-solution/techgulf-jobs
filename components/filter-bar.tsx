"use client";
import type { Dict } from "@/lib/i18n";
import type { JobFilters } from "@/lib/jobs";
import { CATEGORIES, COUNTRY_CODES } from "@/lib/format";
import { Select } from "./select";

type Counts = { country: Record<string, number>; category: Record<string, number> };

export type Patch = Partial<JobFilters>;

export function FilterBar({ d, f, counts, go }: { d: Dict; f: JobFilters; counts: Counts; go: (p: Patch) => void }) {
  const any = (label: string): { value: string; label: string } => ({ value: "", label });
  const toggles = [["visa", d.visa], ["salary", d.salaryDisclosed], ["direct", d.direct], ["nationals", d.nationals]] as const;

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        <Select variant="pill" placeholder={d.anywhere} value={f.country ?? ""} onChange={(v) => go({ country: v, city: "" })}
          options={[any(d.anywhere), ...COUNTRY_CODES.map((c) => ({ value: c, label: d.country[c], hint: String(counts.country[c] ?? 0) }))]} />
        <Select variant="pill" placeholder={d.allFields} value={f.category ?? ""} onChange={(v) => go({ category: v })}
          options={[any(d.allFields), ...CATEGORIES.map((c) => ({ value: c, label: d.category[c], hint: String(counts.category[c] ?? 0) }))]} />
        <Select variant="pill" placeholder={d.anyMode} value={f.mode ?? ""} onChange={(v) => go({ mode: v })}
          options={[any(d.anyMode), ...(["remote", "hybrid", "onsite"] as const).map((m) => ({ value: m, label: d.mode[m] }))]} />
        <Select variant="pill" placeholder={d.anyLevel} value={f.seniority ?? ""} onChange={(v) => go({ seniority: v })}
          options={[any(d.anyLevel), ...(["intern", "junior", "mid", "senior", "lead"] as const).map((m) => ({ value: m, label: d.level[m] }))]} />
        <Select variant="pill" placeholder={d.anyTime} value={f.posted ?? ""} onChange={(v) => go({ posted: v })}
          options={[any(d.anyTime), ...["1", "7", "30"].map((n) => ({ value: n, label: d.last.replace("{n}", n) }))]} />
      </div>
      <div className="-mx-4 mt-2.5 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        <span className="shrink-0 text-xs font-medium text-muted">{d.onlyShow}</span>
        {toggles.map(([k, label]) => {
          const on = f[k] === "1";
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => go({ [k]: on ? "" : "1" })}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${on ? "border-primary bg-primary/10 text-primary" : "border-dashed border-line text-muted hover:border-ink/40 hover:text-ink"}`}>
              <span aria-hidden>{on ? "✓" : "+"}</span>{label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SortSelect({ d, f, go }: { d: Dict; f: JobFilters; go: (p: Patch) => void }) {
  return (
    <Select variant="pill" placeholder={d.sortRelevance} value={f.sort ?? ""} onChange={(v) => go({ sort: v })}
      options={[{ value: "", label: d.sortRelevance }, { value: "date", label: d.sortDate }, { value: "salary", label: d.sortSalary }]} className="[&>button]:border-line [&>button]:bg-surface [&>button]:text-ink" />
  );
}
