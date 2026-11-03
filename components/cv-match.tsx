"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import type { Job } from "@/lib/types";
import { COMPANIES } from "@/lib/mock-data";
import { formatSalary } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Logo } from "./ui";
import { CheckIcon, UploadIcon } from "./icons";

// Simulated parse result until the AI backend exists
const DETECTED = { title: "Full-stack Developer", years: 5, skills: ["React", "TypeScript", "Node.js", "AWS", "PostgreSQL", "Python", "Docker"] };
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
  const [stage, setStage] = useState<"idle" | "parsing" | "done">("idle");
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const [skills, setSkills] = useState<string[]>(DETECTED.skills);
  const input = useRef<HTMLInputElement>(null);
  // CV uploaded during profile setup → show results straight away
  const { profile } = useStore();
  const [replaced, setReplaced] = useState(false);
  const useProfileCv = stage === "idle" && !!profile?.cvName && !replaced;
  const view = useProfileCv ? "done" : stage;
  const cvFile = useProfileCv ? profile!.cvName : file;

  const start = (f?: File) => {
    if (!f) return;
    setFile(f.name);
    setStage("parsing");
    setStep(0);
    [1, 2, 3].forEach((s) => setTimeout(() => setStep(s), s * 650));
    setTimeout(() => setStage("done"), 2300);
  };

  const scored = useMemo(() => jobs.map((j) => {
    const have = j.tags.filter((x) => skills.includes(x));
    const missing = j.tags.filter((x) => !skills.includes(x));
    const exp = j.seniority === "senior" || j.seniority === "lead" ? 8 : 0;
    return { j, have, missing, score: Math.min(97, Math.round(35 + (have.length / Math.max(j.tags.length, 1)) * 55 + exp)) };
  }).sort((a, b) => b.score - a.score), [jobs, skills]);

  const gaps = useMemo(() => {
    const m = new Map<string, number>();
    scored.forEach((s) => s.missing.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [scored]);
  const maxGap = gaps[0]?.[1] ?? 1;

  /* ---------- Idle ---------- */
  if (view === "idle")
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); start(e.dataTransfer.files[0]); }}
          onClick={() => input.current?.click()}
          role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
          className={`flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${drag ? "border-primary bg-primary/5" : "border-line bg-surface hover:border-ink/30"}`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadIcon className="h-7 w-7" /></span>
          <p className="mt-4 text-lg font-semibold">{drag ? t.dropNow : t.dropTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.dropSub}</p>
          <span className="mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.upload}</span>
          <p className="mt-4 text-xs text-muted">PDF, DOCX · max 5 MB</p>
          <input ref={input} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => start(e.target.files?.[0])} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">{t.howTitle}</p>
          <ol className="mt-4 space-y-5">
            {t.how.map(([h, s], i) => (
              <li key={h} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold">{i + 1}</span>
                <div><p className="font-medium">{h}</p><p className="mt-0.5 text-sm text-muted">{s}</p></div>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex gap-2 border-t border-line pt-4 text-xs text-muted"><span aria-hidden>🔒</span>{t.privacy}</p>
        </div>
      </div>
    );

  /* ---------- Parsing ---------- */
  if (view === "parsing")
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8" role="status" aria-live="polite">
        <p className="truncate text-sm text-muted" dir="ltr">{file}</p>
        <ul className="mt-5 space-y-4">
          {t.steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-sm transition ${i <= step ? "text-ink" : "text-muted/60"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full ${i < step ? "bg-primary text-on-primary" : i === step ? "border-2 border-primary border-t-transparent animate-spin" : "border border-line"}`}>
                {i < step && <CheckIcon className="h-3.5 w-3.5" />}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    );

  /* ---------- Results ---------- */
  const top = scored.slice(0, 6);
  const strong = scored.filter((s) => s.score >= 75).length;
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">{t.profile}</p>
            <button onClick={() => { setReplaced(true); setStage("idle"); }} className="text-xs font-medium text-primary hover:underline">{t.replace}</button>
          </div>
          <p className="mt-2 text-lg font-semibold">{useProfileCv ? profile!.title : DETECTED.title}</p>
          <p className="text-sm text-muted">{t.years.replace("{n}", String(DETECTED.years))} · <span dir="ltr">{cvFile}</span></p>
          <p className="mt-4 text-xs font-medium text-muted">{t.yourSkills}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...new Set([...DETECTED.skills, ...skills, ...EXTRA])].map((s) => {
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
            const c = COMPANIES.find((x) => x.slug === j.companySlug)!;
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
