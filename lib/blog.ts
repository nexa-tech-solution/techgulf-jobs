/**
 * Blog posts. To publish a new post, add an object at the TOP of `POSTS`.
 * Body syntax (one string per block): "## Heading", "- list item", anything else = paragraph.
 */
export type BlogCategory = "ai" | "dev" | "security" | "cloud" | "career";

export interface Post {
  slug: string;
  title: string;
  summary: string;
  category: BlogCategory;
  date: string; // YYYY-MM-DD
  author: string;
  hot?: boolean;
  /** Cover image: put a 16:9 file in /public/blog/ (≥1600px wide). Defaults to /blog/<slug>.jpg */
  cover?: string;
  coverAlt: string;
  tags: string[];
  body: string[];
}

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

export const BLOG_CATEGORIES: BlogCategory[] = ["ai", "dev", "security", "cloud", "career"];
export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
export const coverOf = (p: Post) => p.cover ?? `/blog/${p.slug}.jpg`;
export const readMins = (p: Post) => Math.max(1, Math.round(p.body.join(" ").split(/\s+/).length / 200));
