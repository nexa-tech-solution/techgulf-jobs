"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import type { Category, Job } from "@/lib/types";
import { CATEGORIES, COUNTRY_CODES, formatSalary } from "@/lib/format";
import { GOOD_SCORE, STRONG_SCORE, matchJob, profileJobs, rankSkills, type JobMatch } from "@/lib/skill-match";
import { useStore } from "@/lib/store";
import { Select } from "./select";
import { Logo, inputCls } from "./ui";
import { CheckIcon } from "./icons";

const PAGE = 6;
const VISIBLE_SKILLS = 18;
const YEAR_OPTIONS = ["0", "1", "2", "3", "5", "8", "10", "15"];

function Ring({ value }: { value: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center" aria-label={`${value}% match`}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <span className="text-xs font-semibold tabular-nums tracking-tight" dir="ltr">{value}%</span>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-end font-medium">{children}</dd>
    </div>
  );
}

function MatchCard({ m, d, lang, years, onAdd }: { m: JobMatch; d: Dict; lang: Locale; years: number | null; onAdd: (skill: string) => void }) {
  const t = d.cvPage;
  const { job: j } = m;
  const c = { name: j.company, color: j.companyColor ?? "#64748b", logo: j.companyLogo };
  const strength = m.score >= STRONG_SCORE ? t.strongLabel : m.score >= GOOD_SCORE ? t.goodLabel : t.partialLabel;
  const experience = m.yearsLabel == null
    ? t.notStated
    : `${t.needsYears.replace("{n}", m.yearsLabel)}${years == null || m.yearsNeeded == null ? "" : ` · ${years >= m.yearsNeeded ? t.youMeet : t.youAreBelow}`}`;

  return (
    <li className="card p-4 md:p-5">
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <Ring value={m.score} />
          <span className="text-[11px] font-medium text-muted">{strength}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted"><Logo company={c} size={20} /><span className="truncate">{j.company} · {j.city ?? d.country.REMOTE}</span></div>
          <Link href={`/${lang}/jobs/${j.id}`} className="mt-1 block text-[17px] font-semibold hover:text-primary"><bdi>{j.title}</bdi></Link>
          {j.salary && <p className="text-sm font-medium"><bdi>{formatSalary(j.salary, d)}</bdi></p>}
          <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
            {m.have.map((s) => <span key={s} className="inline-flex h-6 items-center gap-1 rounded-md bg-primary/10 px-1.5 font-mono text-[11px] text-primary"><CheckIcon className="h-3 w-3" />{s}</span>)}
            {m.missing.map((s) => <span key={s} className="inline-flex h-6 items-center rounded-md border border-dashed border-line px-1.5 font-mono text-[11px] text-muted">{s}</span>)}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary">{t.whyScore}</summary>
            <dl className="mt-2 divide-y divide-line border-y border-line">
              <Fact label={t.factSkills}>{t.skillsOf.replace("{have}", String(m.have.length)).replace("{total}", String(j.tags.length))}</Fact>
              {m.optional.length > 0 && <Fact label={t.factOptional}><span dir="ltr">{m.optional.join(", ")}</span></Fact>}
              <Fact label={t.factExperience}>{experience}</Fact>
              <Fact label={t.factLevel}>{d.level[j.seniority]}</Fact>
              <Fact label={t.factMode}>{d.mode[j.mode]}</Fact>
            </dl>
            {m.next && m.next.score > m.score && (
              <button type="button" onClick={() => onAdd(m.next!.skill)} className="mt-3 text-sm font-medium hover:text-primary">
                {t.addFor.replace("{skill}", m.next.skill).replace("{score}", String(m.next.score))}
              </button>
            )}
          </details>
        </div>
      </div>
    </li>
  );
}

export function CvMatch({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const t = d.cvPage;
  const { profile } = useStore();
  const [editedSkills, setSkills] = useState<string[] | null>(null);
  const [editedYears, setYears] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE);

  const skills = useMemo(() => editedSkills ?? profile?.skills ?? [], [editedSkills, profile]);
  const yearsText = editedYears ?? profile?.years ?? "";
  const years = yearsText !== "" && !Number.isNaN(parseInt(yearsText, 10)) ? parseInt(yearsText, 10) : null;

  const toggle = (s: string) => { setSkills(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s]); setShown(PAGE); };
  const add = (s: string) => { if (!skills.includes(s)) setSkills([...skills, s]); };

  // Reads every description, so it runs once per job list rather than on each click.
  const profiles = useMemo(() => profileJobs(jobs), [jobs]);
  const catalog = useMemo(() => rankSkills(jobs), [jobs]);
  const roles = useMemo(() => CATEGORIES
    .map((c) => ({ key: c as Category, top: rankSkills(jobs.filter((j) => j.category === c)).slice(0, 5).map((x) => x.skill) }))
    .filter((r) => r.top.length >= 3), [jobs]);

  const inScope = useMemo(() => profiles.filter(({ job }) => job.tags.length > 0 && (!country || job.country === country) && (!category || job.category === category)), [profiles, country, category]);
  const matches = useMemo(() => {
    const set = new Set(skills);
    return inScope.map((p) => matchJob(p, set)).sort((a, b) => b.score - a.score);
  }, [inScope, skills]);
  const relevant = matches.filter((m) => m.score > 0);

  const gaps = useMemo(() => {
    // Only jobs already partly matched: a skill for a job you could never get is poor advice.
    const counts = new Map<string, number>();
    for (const m of relevant) for (const s of m.missing) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [relevant]);
  const maxGap = gaps[0]?.[1] ?? 1;

  const strong = relevant.filter((m) => m.score >= STRONG_SCORE).length;
  const good = relevant.filter((m) => m.score >= GOOD_SCORE && m.score < STRONG_SCORE).length;

  const query = search.trim().toLowerCase();
  const pickable = query
    ? catalog.filter((x) => x.skill.toLowerCase().includes(query))
    : catalog.filter((x) => !skills.includes(x.skill)).slice(0, VISIBLE_SKILLS);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold">{t.yourSkillsTitle}</p>
            {skills.length > 0 && <button type="button" onClick={() => setSkills([])} className="text-xs font-medium text-muted hover:text-ink">{t.clearSkills}</button>}
          </div>
          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
              {skills.map((s) => (
                <button key={s} type="button" aria-pressed onClick={() => toggle(s)} className="h-7 rounded-md border border-primary bg-primary/10 px-2 font-mono text-[12px] text-primary">{s} ×</button>
              ))}
            </div>
          )}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchSkill} aria-label={t.searchSkill} className={`${inputCls} mt-3 h-10 text-sm`} />
          <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
            {pickable.map(({ skill }) => {
              const on = skills.includes(skill);
              return (
                <button key={skill} type="button" aria-pressed={on} onClick={() => toggle(skill)}
                  className={`h-7 rounded-md border px-2 font-mono text-[12px] transition ${on ? "border-primary bg-primary/10 text-primary" : "border-dashed border-line text-muted hover:text-ink"}`}>
                  {on ? "" : "+ "}{skill}
                </button>
              );
            })}
            {query && pickable.length === 0 && <p className="text-sm text-muted">{t.noSkill}</p>}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <Select variant="field" value={yearsText} onChange={setYears} placeholder={t.yearsLabel}
              options={[{ value: "", label: t.yearsLabel }, ...YEAR_OPTIONS.map((y) => ({ value: y, label: t.years.replace("{n}", y) }))]} />
            <p className="mt-2 text-xs text-muted">{t.yearsHint}</p>
          </div>
        </div>

        {gaps.length > 0 && (
          <div className="card p-5">
            <p className="font-semibold">{t.gapTitle}</p>
            <p className="mt-1 text-sm text-muted">{t.gapSub}</p>
            <ul className="mt-4 space-y-3">
              {gaps.map(([s, n]) => (
                <li key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => add(s)} className="font-mono text-[13px] font-medium hover:text-primary" dir="ltr">+ {s}</button>
                    <span className="text-xs text-muted">{t.moreJobs.replace("{n}", String(n))}</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-line"><div className="h-1 rounded-full bg-primary" style={{ width: `${(n / maxGap) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        {skills.length === 0 ? (
          <section className="card p-6 md:p-8">
            <h2 className="text-xl font-semibold tracking-tight">{t.startTitle}</h2>
            <p className="mt-1 text-muted">{t.startSub}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roles.map((r) => (
                <button key={r.key} type="button" onClick={() => setSkills(r.top)} className="card card-hover p-4 text-start">
                  <span className="block font-semibold">{d.category[r.key]}</span>
                  <span className="mt-1 block font-mono text-xs text-muted" dir="ltr">{r.top.join(" · ")}</span>
                </button>
              ))}
            </div>
            <ol className="mt-6 grid gap-3 border-t border-line pt-5 text-sm text-muted sm:grid-cols-3">
              {t.steps.map((step, i) => <li key={step}><span className="font-semibold text-ink">{i + 1}.</span> {step}</li>)}
            </ol>
          </section>
        ) : (
          <>
            <dl className="card grid grid-cols-3 divide-x divide-line p-0 rtl:divide-x-reverse">
              {[[t.statStrong, strong], [t.statGood, good], [t.statChecked, inScope.length]].map(([label, value]) => (
                <div key={label} className="p-4">
                  <dd className="text-2xl font-bold tracking-tight">{value}</dd>
                  <dt className="text-xs text-muted sm:text-sm">{label}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">{t.topMatches}</h2>
              <div className="flex flex-wrap gap-2">
                <Select variant="pill" value={country} onChange={(v) => { setCountry(v); setShown(PAGE); }} placeholder={d.anywhere}
                  options={[{ value: "", label: d.anywhere }, ...COUNTRY_CODES.map((c) => ({ value: c, label: d.country[c] }))]} />
                <Select variant="pill" value={category} onChange={(v) => { setCategory(v); setShown(PAGE); }} placeholder={d.allFields}
                  options={[{ value: "", label: d.allFields }, ...CATEGORIES.map((c) => ({ value: c, label: d.category[c] }))]} />
              </div>
            </div>

            {relevant.length === 0 ? (
              <p className="card mt-4 p-6 text-muted">{t.noMatches}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {relevant.slice(0, shown).map((m) => <MatchCard key={m.job.id} m={m} d={d} lang={lang} years={years} onAdd={add} />)}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {relevant.length > shown
                ? <button type="button" onClick={() => setShown(shown + PAGE)} className="h-11 rounded-lg border border-line bg-surface px-5 text-sm font-semibold hover:border-primary">{d.showMore.replace("{n}", String(Math.min(PAGE, relevant.length - shown)))}</button>
                : <span />}
              <Link href={`/${lang}/jobs`} className="text-sm font-medium text-primary hover:underline">{t.seeAll}</Link>
            </div>
            <p className="mt-4 text-xs text-muted">{t.method}</p>
          </>
        )}
      </div>
    </div>
  );
}
