import type { Post } from "./blog";
import type { CostRow, Guide, JourneyStep } from "./types";

// Initial content for scripts/seed-firestore.mjs. The app reads these from Firestore.
export const POSTS: Post[] = [
  {
    slug: "ai-hiring-gulf-2026", coverAlt: "Abstract render of an AI neural network", title: "AI roles are now 1 in 5 tech openings in the UAE", category: "ai", date: "2026-11-02", author: "TechGulf Desk", hot: true,
    summary: "LLM engineers, MLOps and data platform roles grew fastest this quarter. Here is what employers ask for.",
    tags: ["LLM", "MLOps", "Hiring"],
    body: [
      "Across the job pages we track, roles mentioning LLMs, RAG or MLOps made up about 20% of new UAE tech openings in October, up from roughly 12% a year earlier.",
      "## What employers ask for",
      "- Production Python and at least one cloud (AWS or Azure most common)",
      "- Experience shipping retrieval or agent features, not only notebooks",
      "- Evaluation and monitoring: how you know the model still works",
      "## Salary picture",
      "Mid-level ML engineers in Dubai are commonly offered AED 28,000–38,000 per month. Arabic-language NLP experience is a clear premium.",
    ],
  },
  {
    slug: "nextjs-16-what-changed", coverAlt: "Code on a laptop screen", title: "Next.js 16: what changed for production apps", category: "dev", date: "2026-10-29", author: "TechGulf Desk",
    summary: "Typed route props, stricter async params and faster Turbopack builds. A quick checklist before you upgrade.",
    tags: ["Next.js", "React", "Frontend"],
    body: [
      "Next.js 16 makes route params and search params async everywhere, and adds generated `PageProps` / `LayoutProps` types per route.",
      "## Upgrade checklist",
      "- Await `params` and `searchParams` in pages, layouts and metadata functions",
      "- Remove old webpack-only config if you move to Turbopack",
      "- Re-run your build and check bundle size; most teams see faster builds",
      "Frontend roles in Riyadh and Bengaluru increasingly list Next.js experience by name.",
    ],
  },
  {
    slug: "phishing-gulf-job-seekers", coverAlt: "Glowing digital lock representing cybersecurity", title: "Fake job offers targeting developers: how to spot them", category: "security", date: "2026-10-24", author: "TechGulf Desk", hot: true,
    summary: "Scammers copy real company names and ask for 'visa fees'. Five checks that take two minutes.",
    tags: ["Scams", "Security"],
    body: [
      "Fake recruiters often send offers on WhatsApp with a real company logo and a PDF contract, then ask for a visa or medical fee.",
      "## Five quick checks",
      "- The email domain matches the company's real website",
      "- The role exists on the company's own careers page",
      "- Nobody asks you to pay anything; employers cover visa costs by law",
      "- The interview happened with real people from the team",
      "- The offer letter names a real office address you can verify",
    ],
  },
  {
    slug: "saudi-cloud-regions", coverAlt: "Earth from space with network lights", title: "New cloud regions in Saudi Arabia are creating DevOps jobs", category: "cloud", date: "2026-10-18", author: "TechGulf Desk",
    summary: "Data residency rules push banks and government projects onto local regions, and they need people to run them.",
    tags: ["Cloud", "DevOps", "KSA"],
    body: [
      "Several hyperscalers now run regions in Saudi Arabia. Data residency rules mean many banks and public-sector projects must host locally.",
      "## Skills in demand",
      "- Kubernetes and Terraform",
      "- Landing zones and network design",
      "- Security certifications (CCSP, AWS Security Specialty)",
    ],
  },
  {
    slug: "switching-from-india-to-dubai", coverAlt: "Dubai skyline with Burj Khalifa", title: "From Bengaluru to Dubai: a backend engineer's first 90 days", category: "career", date: "2026-10-10", author: "Guest post",
    summary: "Notice period, attestation, the first month's rent and what the team actually expected.",
    tags: ["Career", "Relocation"],
    body: [
      "Plan for about eight weeks from offer to first day. Degree attestation took the longest.",
      "## Money in month one",
      "Most landlords want rent in one to four cheques. Ask your employer for a housing advance before you sign a lease.",
      "## At work",
      "Teams were more multinational than expected, and English was the working language everywhere.",
    ],
  },
];

export const GUIDES: Guide[] = [
  { region: "UAE", title: "UAE work visa for developers", mins: 6, updated: "2026-10-28",
    summary: "What happens between signing an offer and getting your Emirates ID — and who pays for what.",
    steps: ["Employer applies for your entry permit (3–5 working days).", "Enter the UAE and complete the medical fitness test.", "Biometrics for Emirates ID; visa stamped in 1–2 weeks.", "By law the employer pays all visa and medical costs."] },
  { region: "UAE", title: "Golden Visa for tech talent", mins: 4, updated: "2026-09-12",
    summary: "A 10-year residence that doesn't depend on your employer. Who qualifies and how to apply.",
    steps: ["Salary of AED 30,000+/month or a recognised tech specialism.", "Degree attested by UAE Ministry of Education.", "Apply via ICP or GDRFA; decision usually within 30 days."] },
  { region: "KSA", title: "Saudi Iqama, step by step", mins: 7, updated: "2026-10-20",
    summary: "From work visa to Iqama, plus how Saudization (Nitaqat) affects which roles are open to you.",
    steps: ["Employer issues work visa via Qiwa; you get it stamped at the embassy.", "Arrive, complete medical and biometrics.", "Iqama issued digitally on Absher within ~2 weeks.", "Look for the “Nationals preferred” label — some roles are quota-reserved."] },
  { region: "QA", title: "Qatar residence permit (QID)", mins: 5, updated: "2026-08-30",
    summary: "Work permit, QID and changing jobs since Qatar removed the exit-permit rule.",
    steps: ["Employer applies for work visa through the Ministry of Labour.", "Medical and fingerprinting at a Qatar Visa Centre.", "QID issued; you can change employers after notice period."] },
  { region: "IN", title: "Moving from India to the Gulf", mins: 8, updated: "2026-11-01",
    summary: "Paperwork to start before you resign, so your visa isn't stuck for weeks.",
    steps: ["Attest your degree: state HRD → MEA apostille → embassy.", "Check if ECR applies to your passport (usually not for graduates).", "Keep salary slips and relieving letter — Gulf employers ask for both.", "Open an NRE account once you land to send money home tax-free."] },
  { region: "IN", title: "Negotiating a Gulf offer in INR terms", mins: 5, updated: "2026-10-05",
    summary: "How to compare a tax-free AED/SAR package with your LPA salary, including housing and flights.",
    steps: ["Convert basic + housing + transport, not just basic.", "Add annual flight allowance and end-of-service gratuity.", "Subtract rent if housing isn't provided — it's the biggest cost."] },
];

export const JOURNEY: JourneyStep[] = [
  { t: "Attest documents", s: "2–4 weeks", d: "Degree attestation and police clearance — start before you apply." },
  { t: "Interview & offer", s: "2–6 weeks", d: "Most Gulf tech hiring is 3–4 rounds, often fully remote." },
  { t: "Entry permit", s: "3–10 days", d: "Employer files it; you never pay for this." },
  { t: "Arrive & medical", s: "Week 1", d: "Medical test, biometrics, open a bank account." },
  { t: "Residence ID", s: "Week 2–3", d: "Emirates ID / Iqama / QID — then lease, SIM and car loan are possible." },
];

export const COST: CostRow[] = [
  { city: "Dubai", cur: "AED", rent: 7500, transport: 600, food: 1800, salary: 27000 },
  { city: "Riyadh", cur: "SAR", rent: 4500, transport: 900, food: 1600, salary: 25000 },
  { city: "Doha", cur: "QAR", rent: 6500, transport: 700, food: 1700, salary: 25000 },
  { city: "Bengaluru", cur: "INR", rent: 30000, transport: 4000, food: 12000, salary: 250000 },
];
