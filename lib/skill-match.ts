import { analyzeJob } from "./job-analysis";
import type { Job } from "./types";

// An optional skill counts for half: missing it should hurt less than missing a core one.
const OPTIONAL_WEIGHT = 0.5;
// One matching tag out of one is not a 100% match, so a job always counts as at least 3 skills.
const MIN_WEIGHT = 3;

export const STRONG_SCORE = 75;
export const GOOD_SCORE = 40;

export interface JobProfile { job: Job; optional: string[]; yearsNeeded: number | null; yearsLabel?: string }

export interface JobMatch extends JobProfile {
  score: number;
  have: string[];
  missing: string[];
  /** The single missing skill that raises this job's score most, with the score it would give. */
  next?: { skill: string; score: number };
}

export function profileJobs(jobs: Job[]): JobProfile[] {
  return jobs.map((job) => {
    const a = analyzeJob(job.description, job.tags);
    return { job, optional: a.optionalSkills, yearsNeeded: a.years ? parseInt(a.years, 10) : null, yearsLabel: a.years };
  });
}

function scoreOf(p: JobProfile, skills: Set<string>) {
  const weight = (tag: string) => (p.optional.includes(tag) ? OPTIONAL_WEIGHT : 1);
  const total = p.job.tags.reduce((sum, t) => sum + weight(t), 0);
  const got = p.job.tags.filter((t) => skills.has(t)).reduce((sum, t) => sum + weight(t), 0);
  return Math.round((got / Math.max(total, MIN_WEIGHT)) * 100);
}

export function matchJob(p: JobProfile, skills: Set<string>): JobMatch {
  const have = p.job.tags.filter((t) => skills.has(t));
  const missing = p.job.tags.filter((t) => !skills.has(t));
  // Core skills first, so the suggestion is the one that matters most.
  const best = [...missing].sort((a, b) => Number(p.optional.includes(a)) - Number(p.optional.includes(b)))[0];
  return {
    ...p, have, missing, score: scoreOf(p, skills),
    ...(best && { next: { skill: best, score: scoreOf(p, new Set([...skills, best])) } }),
  };
}

/** Skills ranked by how many jobs ask for them. */
export function rankSkills(jobs: Job[]) {
  const counts = new Map<string, number>();
  for (const j of jobs) for (const t of j.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count);
}
