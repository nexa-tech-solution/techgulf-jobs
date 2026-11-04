"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { formatSalary } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Logo } from "./ui";
import { CheckIcon } from "./icons";

const EXTRA = ["Kubernetes", "Go", "Kafka", "Terraform", "Next.js", "Django", "Spark", "LLM", "Java", "Spring"];

function Ring({ value }: { value: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center" aria-label={`${value}% match`}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <span className="text-sm font-semibold tabular-nums" dir="ltr">{value}%</span>
    </div>
  );
}

export function CvMatch({ d, lang, jobs }: { d: Dict; lang: Locale; jobs: Job[] }) {
  const t = d.cvPage;
  const { profile } = useStore();
  const [editedSkills, setSkills] = useState<string[] | null>(null);
  const foundSkills = useMemo(() => profile?.skills ?? [], [profile]);
  const skills = useMemo(() => editedSkills ?? foundSkills, [editedSkills, foundSkills]);

  const scored = useMemo(() => jobs.map((j) => {
    const have = j.tags.filter((x) => skills.includes(x));
    const missing = j.tags.filter((x) => !skills.includes(x));
    // Share of the employer's keywords among the chosen skills
    return { j, have, missing, score: Math.round((have.length / Math.max(j.tags.length, 1)) * 100) };
  }).sort((a, b) => b.score - a.score), [jobs, skills]);

  const gaps = useMemo(() => {
    const m = new Map<string, number>();
    scored.forEach((s) => s.missing.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [scored]);
  const maxGap = gaps[0]?.[1] ?? 1;

  /* ---------- Results ---------- */
  const top = scored.slice(0, 6);
  const strong = scored.filter((s) => s.score >= 75).length;
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-medium text-muted">{t.profile}</p>
          {profile?.title && <p className="mt-2 text-lg font-semibold">{profile.title}</p>}
          {profile?.years && <p className="text-sm text-muted">{t.years.replace("{n}", profile.years)}</p>}
          <p className="mt-4 text-xs font-medium text-muted">{t.yourSkills}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...new Set([...foundSkills, ...skills, ...EXTRA])].map((s) => {
              const on = skills.includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => setSkills(on ? skills.filter((x) => x !== s) : [...skills, s])} dir="ltr"
                  className={`h-7 rounded-md border px-2 font-mono text-[12px] transition ${on ? "border-primary bg-primary/10 text-primary" : "border-dashed border-line text-muted hover:text-ink"}`}>
                  {on ? "" : "+ "}{s}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">{t.editHint}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="font-semibold">{t.gapTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.gapSub}</p>
          <ul className="mt-4 space-y-3">
            {gaps.map(([s, n]) => (
              <li key={s}>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setSkills([...skills, s])} className="font-mono text-[13px] font-medium hover:text-primary" dir="ltr">+ {s}</button>
                  <span className="text-xs text-muted">{t.moreJobs.replace("{n}", String(n))}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-2"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(n / maxGap) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
          <p className="text-sm font-semibold text-accent">★ {d.premium}</p>
          <p className="mt-1.5 text-sm">{d.premiumSub}</p>
          <p className="mt-2 text-xs text-muted">{d.premiumPrice}</p>
        </div>
      </aside>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{t.topMatches}</h2>
          <p className="text-sm text-muted">{t.strong.replace("{n}", String(strong))}</p>
        </div>
        <ul className="mt-4 space-y-3">
          {top.map(({ j, score, have, missing }) => {
            const c = { name: j.company, color: j.companyColor ?? "#64748b", logo: j.companyLogo };
            return (
              <li key={j.id} className="rounded-2xl border border-line bg-surface p-4 transition hover:border-ink/25 md:p-5">
                <div className="flex gap-4">
                  <Ring value={score} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted"><Logo company={c} size={20} />{j.company} · {j.city ?? d.country.REMOTE}</div>
                    <Link href={`/${lang}/jobs/${j.id}`} className="mt-1 block text-[17px] font-semibold hover:text-primary"><bdi>{j.title}</bdi></Link>
                    {j.salary && <p className="text-sm font-medium"><bdi>{formatSalary(j.salary, d)}</bdi></p>}
                    <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
                      {have.map((s) => <span key={s} className="inline-flex h-6 items-center gap-1 rounded-md bg-primary/10 px-1.5 font-mono text-[11px] text-primary"><CheckIcon className="h-3 w-3" />{s}</span>)}
                      {missing.map((s) => <span key={s} className="inline-flex h-6 items-center rounded-md border border-dashed border-line px-1.5 font-mono text-[11px] text-muted">{s}</span>)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href={`/${lang}/jobs`} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">{t.seeAll}</Link>
      </div>
    </div>
  );
}
