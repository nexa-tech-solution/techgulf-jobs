import { cacheLife } from "next/cache";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { app } from "./firebase";
import type { Post } from "./blog";
import { buildLandings, isIndexable, type Landing } from "./landing";
import type { City, Company, GuidesContent, Job, MarketData } from "./types";

// Server-only reads. lib/jobs.ts is also imported by client components, so this stays separate.
// Cached because Firestore bills per document read: traffic must not multiply reads.
export async function getCatalog(): Promise<{ jobs: Job[]; companies: Company[]; cities: City[]; now: string }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const db = getFirestore(app);
  const [jobSnap, companySnap, citySnap] = await Promise.all([
    // The status filter is required: firestore.rules rejects queries without it.
    getDocs(query(collection(db, "jobs"), where("status", "==", "active"))),
    getDocs(collection(db, "companies")),
    getDocs(collection(db, "cities")),
  ]);

  const companies = companySnap.docs.map((d) => ({ ...d.data(), slug: d.id }) as Company);
  const bySlug = new Map(companies.map((c) => [c.slug, c]));
  const jobs = jobSnap.docs
    .map((d) => {
      const job = { ...d.data(), id: d.id } as Job;
      return { ...job, companyColor: bySlug.get(job.companySlug)?.color, companyLogo: bySlug.get(job.companySlug)?.logo };
    })
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.postedAt.localeCompare(a.postedAt));

  return {
    jobs,
    companies,
    cities: citySnap.docs.map((d) => ({ ...d.data(), slug: d.id }) as City),
    now: new Date().toISOString(),
  };
}

/** Only what one job page needs, so rendering it does not load the whole catalog repeatedly. */
export async function getJobView(id: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const { jobs, companies, now } = await getCatalog();
  // Pages rendered on demand get the param still encoded, and some ids contain ":" (seen as %3A).
  const decoded = decodeURIComponent(id);
  const job = jobs.find((j) => j.id === decoded);
  if (!job) return null;
  return {
    job,
    company: companies.find((c) => c.slug === job.companySlug),
    similar: jobs.filter((j) => j.id !== job.id && (j.category === job.category || j.country === job.country)).slice(0, 4),
    companyJobCount: jobs.filter((j) => j.companySlug === job.companySlug).length,
    now,
  };
}

/** Only what one browse page needs. Related pages drop their jobs because only their labels are shown. */
export async function getLandingView(slug: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const { jobs, companies, cities, now } = await getCatalog();
  const all = buildLandings(jobs);
  const page = all.find((p) => p.slug === slug);
  if (!page) return null;
  const sameKind = (p: Landing) => JSON.stringify(p.where) === JSON.stringify(page.where) || JSON.stringify(p.what) === JSON.stringify(page.what);
  return {
    page,
    related: all.filter((p) => p.slug !== slug && isIndexable(p) && sameKind(p)).slice(0, 8).map(({ slug, what, where }) => ({ slug, what, where })),
    companies: companies.filter((c) => page.jobs.some((j) => j.companySlug === c.slug)),
    cities,
    now,
  };
}

export async function getMarketData(): Promise<MarketData | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });

  const snap = await getDoc(doc(getFirestore(app), "market", "current"));
  return snap.exists() ? (snap.data() as MarketData) : null;
}

export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });

  const snap = await getDocs(collection(getFirestore(app), "posts"));
  return snap.docs
    .map((d) => ({ ...d.data(), slug: d.id }) as Post)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getGuidesContent(lang: string): Promise<GuidesContent | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });

  const db = getFirestore(app);
  const snap = lang === "ar" ? await getDoc(doc(db, "content", "guides_ar")) : null;
  // English is the fallback until a translation is published.
  const used = snap?.exists() ? snap : await getDoc(doc(db, "content", "guides"));
  return used.exists() ? (used.data() as GuidesContent) : null;
}
