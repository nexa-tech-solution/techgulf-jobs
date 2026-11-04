"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import type { Company, Country } from "@/lib/types";
import { Logo } from "./ui";
import { Select } from "./select";
import { ArrowIcon, SearchIcon } from "./icons";

export interface CompanyStats {
  company: Company;
  country: Country;
  open: number;
  salaryPct: number;
  visa: boolean;
  remote: boolean;
  tags: string[];
  cities: string[];
}

export function CompanyDirectory({ d, lang, items }: { d: Dict; lang: Locale; items: CompanyStats[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [sort, setSort] = useState("jobs");
  const [visaOnly, setVisaOnly] = useState(false);
  const c = d.companiesPage;

  const countries = [...new Set(items.map((i) => i.country))];
  const industries = [...new Set(items.map((i) => i.company.industry).filter(Boolean))].sort();

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = items.filter((i) =>
      (!t || `${i.company.name} ${i.company.industry} ${i.tags.join(" ")}`.toLowerCase().includes(t)) &&
      (!country || i.country === country) &&
      (!industry || i.company.industry === industry) &&
      (!visaOnly || i.visa),
    );
    return out.sort((a, b) =>
      sort === "name" ? a.company.name.localeCompare(b.company.name)
        : sort === "salary" ? b.salaryPct - a.salaryPct
          : b.open - a.open,
    );
  }, [items, q, country, industry, sort, visaOnly]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search} aria-label={c.search}
            className="h-10 w-full rounded-full border border-line bg-surface ps-10 pe-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
          <Select variant="pill" placeholder={d.anywhere} value={country} onChange={setCountry}
            options={[{ value: "", label: d.anywhere }, ...countries.map((x) => ({ value: x, label: d.country[x], hint: String(items.filter((i) => i.country === x).length) }))]} />
          <Select variant="pill" placeholder={c.allIndustries} value={industry} onChange={setIndustry}
            options={[{ value: "", label: c.allIndustries }, ...industries.map((x) => ({ value: x, label: x }))]} />
          <button type="button" aria-pressed={visaOnly} onClick={() => setVisaOnly(!visaOnly)}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${visaOnly ? "border-primary bg-primary/10 text-primary" : "border-dashed border-line text-muted hover:border-ink/40 hover:text-ink"}`}>
            <span aria-hidden>{visaOnly ? "✓" : "+"}</span>{c.sponsorsVisa}
          </button>
        </div>
        <div className="flex items-center gap-2 lg:ms-auto">
          <span className="text-sm text-muted">{d.sortBy}</span>
          <Select variant="pill" placeholder={c.sortJobs} value={sort} onChange={setSort}
            className="[&>button]:border-line [&>button]:bg-surface [&>button]:text-ink"
            options={[{ value: "jobs", label: c.sortJobs }, { value: "salary", label: c.sortSalary }, { value: "name", label: c.sortName }]} />
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">{c.showing.replace("{n}", String(list.length))}</p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => (
          <Link key={i.company.slug} href={`/${lang}/companies/${i.company.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:border-ink/25 hover:shadow-[0_8px_24px_-16px_rgb(15_23_42/0.35)]">
            <div className="flex items-start gap-3">
              <Logo company={i.company} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold group-hover:text-primary">{i.company.name}</p>
                <p className="truncate text-sm text-muted">{i.company.industry}</p>
              </div>
              {i.visa && <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">{c.visaBadge}</span>}
            </div>

            <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted" dir="auto">{i.company.about}</p>

            <dl className={`mt-4 grid ${i.company.size ? "grid-cols-3" : "grid-cols-2"} divide-x divide-line rounded-xl bg-surface-2 py-2.5 text-center rtl:divide-x-reverse`}>
              <div><dt className="text-[11px] text-muted">{c.openRoles}</dt><dd className="text-lg font-semibold tabular-nums">{i.open}</dd></div>
              <div><dt className="text-[11px] text-muted">{c.salaryShown}</dt><dd className="text-lg font-semibold tabular-nums" dir="ltr">{i.salaryPct}%</dd></div>
              {i.company.size && <div><dt className="text-[11px] text-muted">{c.size}</dt><dd className="truncate px-1 pt-1 text-sm font-semibold" dir="ltr">{i.company.size}</dd></div>}
            </dl>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {i.tags.map((t) => <span key={t} dir="ltr" className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">{t}</span>)}
            </div>

            <div className="flex-1" />
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
              <span className="truncate text-muted">{[...i.cities.slice(0, 3), ...(i.remote ? [d.mode.remote] : [])].join(" · ") || i.company.hq}</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-primary">{c.viewJobs} <ArrowIcon /></span>
            </div>
          </Link>
        ))}
      </div>

      {list.length === 0 && (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">{c.empty}</div>
      )}
    </div>
  );
}
