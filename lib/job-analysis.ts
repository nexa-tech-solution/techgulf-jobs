// Rule-based reading of a job description. It only extracts sentences that exist in the
// posting and never infers anything, so an unknown stays empty rather than guessed.

export interface JobAnalysis {
  duties: string[];
  required: string[];
  niceToHave: string[];
  benefits: string[];
  years?: string;
  degree?: string;
  arabic: boolean;
  /** Skills mentioned only in the nice-to-have part of the posting. */
  optionalSkills: string[];
}

type SectionKind = keyof Pick<JobAnalysis, "duties" | "required" | "niceToHave" | "benefits"> | "skip";

// Checked in order: "preferred qualifications" must count as nice-to-have, not as requirements.
const HEADINGS: [SectionKind, RegExp][] = [
  ["skip", /equal (employment|opportunit)|eeo\b|diversity|privacy|disclaimer|accommodation|how to apply|about (us|the company|the team|meesho)|who we are|our (story|mission|culture|values)|life at\b/i],
  ["benefits", /benefit|perks|what we offer|why (join|work)|compensation|what'?s in it for you/i],
  ["niceToHave", /nice[- ]to[- ]have|good[- ]to[- ]have|preferred|bonus|desirable|would be a plus|extra credit/i],
  ["required", /requirement|qualification|must[- ]have|what (you'?ll|you will|you) (need|bring)|who you are|about you|looking for|what (you|we) (have|need|expect)|you (have|bring|are)\b|skills|experience|ideal candidate|expertise/i],
  ["duties", /responsibilit|what (you'?ll|you will|you'?ll be) (do|doing|work on|own)|about the (role|job|position)|the role|your (role|impact|mission)|day[- ]to[- ]day|key accountabilit|in this role|you will\b|job (description|summary)|overview/i],
];

const BULLET = /^\s*(?:[-•*·▪●–]|\d+[.)])\s+/;
const MAX_ITEMS = 6;
const MAX_LENGTH = 220;

const headingKind = (line: string): SectionKind | null => {
  const text = line.trim().replace(/[:：]$/, "");
  if (!text || text.length > 70 || BULLET.test(line) || /[.!?]$/.test(text)) return null;
  return HEADINGS.find(([, re]) => re.test(text))?.[0] ?? null;
};

const sentences = (text: string) =>
  text.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter((s) => s.length > 20);

const clean = (s: string) => {
  const t = s.replace(BULLET, "").trim();
  return t.length > MAX_LENGTH ? `${t.slice(0, MAX_LENGTH).replace(/\s+\S*$/, "")}…` : t;
};

const take = (lines: string[]) => {
  const bullets = lines.filter((l) => BULLET.test(l));
  // Sections with bullets keep only the bullets; their intro sentence is filler.
  const items = bullets.length >= 2 ? bullets : lines.flatMap(sentences);
  return [...new Set(items.map(clean).filter((s) => s.length > 3))].slice(0, MAX_ITEMS);
};

const FALLBACK_REQUIRED = /\b(\d+\+?\s*years?|experience (in|with)|proficien|must have|strong (knowledge|understanding)|degree in|familiar(ity)? with|hands-on)\b/i;
const FALLBACK_DUTIES = /^(you will|you'll|you are responsible|responsible for|as an? .{3,60}, you)\b/i;

function findYears(text: string) {
  const m = text.match(/\b(\d{1,2})\s*(?:\+|plus)?\s*(?:(?:-|–|to)\s*(\d{1,2})\s*\+?\s*)?years?\b(?=[^.\n]{0,60}(?:experience|exp\b|background|industry))/i);
  if (!m || Number(m[1]) > 25) return undefined;
  return m[2] ? `${m[1]}–${m[2]}` : `${m[1]}+`;
}

function findDegree(text: string) {
  if (/\b(ph\.?d|doctorate)\b/i.test(text) && !/\b(bachelor|master|b\.?s\.?c?|m\.?s\.?c?)\b/i.test(text)) return "PhD";
  if (/\b(bachelor|b\.?tech|b\.e\.|bsc|b\.s\.|undergraduate degree)\b/i.test(text)) return "Bachelor's";
  if (/\b(master|m\.?tech|msc|m\.s\.)\b/i.test(text)) return "Master's";
  return /\bdegree\b/i.test(text) ? "Degree" : undefined;
}

export function analyzeJob(description: string, tags: string[]): JobAnalysis {
  const groups: Record<SectionKind, string[]> = { duties: [], required: [], niceToHave: [], benefits: [], skip: [] };
  let current: SectionKind | null = null;
  const loose: string[] = [];

  for (const line of description.split("\n")) {
    if (!line.trim()) continue;
    const kind = headingKind(line);
    if (kind) { current = kind; continue; }
    (current ? groups[current] : loose).push(line);
  }

  const allSentences = [...loose, ...groups.duties, ...groups.required].flatMap((l) => (BULLET.test(l) ? [l] : sentences(l)));
  let required = take(groups.required);
  if (!required.length) required = [...new Set(allSentences.filter((s) => FALLBACK_REQUIRED.test(s)).map(clean))].slice(0, MAX_ITEMS);
  let duties = take(groups.duties);
  if (!duties.length) duties = [...new Set(allSentences.filter((s) => FALLBACK_DUTIES.test(s.replace(BULLET, "")) && !FALLBACK_REQUIRED.test(s)).map(clean))].slice(0, MAX_ITEMS);

  // A sentence belongs in one list only.
  required = required.filter((item) => !duties.includes(item));

  const niceText = groups.niceToHave.join("\n");
  const requiredText = [...groups.required, ...groups.duties, ...loose].join("\n");
  const mentions = (tag: string, text: string) => new RegExp(`(^|[^a-z0-9+#.])${tag.replace(/[.+#]/g, "\\$&")}($|[^a-z0-9+#])`, "i").test(text);

  // Requirements first, so a figure in the company intro ("10 years of experience serving…") loses.
  const scoped = groups.required.join("\n");
  return {
    duties, required,
    niceToHave: take(groups.niceToHave),
    benefits: take(groups.benefits),
    years: findYears(scoped) ?? findYears(allSentences.join("\n")),
    degree: findDegree(scoped),
    arabic: /\b(arabic)\b[^.\n]{0,40}\b(required|must|fluen|proficien|native|speaking)|\b(fluen\w*|proficien\w*|native)\b[^.\n]{0,40}\barabic\b/i.test(description),
    optionalSkills: tags.filter((t) => mentions(t, niceText) && !mentions(t, requiredText)),
  };
}
