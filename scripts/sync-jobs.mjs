// Syncs real jobs from public ATS APIs into Firestore.
//   npm run sync:jobs -- --dry-run                 preview, no credentials needed, writes nothing
//   npm run sync:jobs                              write jobs, delete expired ones (run this daily)
//   npm run sync:jobs -- --remove-demo             also delete demo jobs (those not created by this script)
//   npm run sync:jobs -- --dry-run --company=careem
// Writing needs GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json (in the shell or .env)
//
// Each run deletes synced jobs that left the employer's board, passed MAX_AGE_DAYS,
// or belong to a company removed from SOURCES, so the collection cannot grow without limit.

// To add a company: find its board slug on its careers page and add one line.
const SOURCES = [
  { ats: "greenhouse", board: "careem", slug: "careem", industry: "Super-app / Mobility", about: "Super-app for rides, food delivery and payments across the Middle East.", domain: "careem.com", name: "Careem", color: "#16a34a", hq: "Dubai, UAE" },
  { ats: "greenhouse", board: "tamara", slug: "tamara", industry: "Fintech / BNPL", about: "Buy-now-pay-later and payments platform for shoppers in the GCC.", domain: "tamara.co", name: "Tamara", color: "#7c3aed", hq: "Riyadh, Saudi Arabia" },
  { ats: "greenhouse", board: "groww", slug: "groww", industry: "Fintech / Investing", about: "Investing app for stocks and mutual funds in India.", domain: "groww.in", name: "Groww", color: "#00b386", hq: "Bengaluru, India" },
  { ats: "ashby", board: "ziina", slug: "ziina", industry: "Fintech / Payments", about: "Payments app for people and small businesses in the UAE.", domain: "ziina.com", name: "Ziina", color: "#0f766e", hq: "Dubai, UAE" },
  { ats: "lever", board: "cred", slug: "cred", industry: "Fintech", about: "Credit card bill payments and rewards app for India.", domain: "cred.club", name: "CRED", color: "#1f2937", hq: "Bengaluru, India" },
  { ats: "lever", board: "meesho", slug: "meesho", industry: "E-commerce", about: "Online marketplace for value shoppers and small sellers in India.", domain: "meesho.com", name: "Meesho", color: "#9f2089", hq: "Bengaluru, India" },
  { ats: "workable", board: "salla", slug: "salla", industry: "E-commerce SaaS", about: "Platform for building and running online stores in Saudi Arabia.", domain: "salla.com", name: "Salla", color: "#004d5a", hq: "Riyadh, Saudi Arabia" },
  { ats: "workable", board: "lucidya", slug: "lucidya", industry: "AI / Customer experience", about: "AI platform for customer experience and social listening, with a focus on Arabic.", domain: "lucidya.com", name: "Lucidya", color: "#4f46e5", hq: "Riyadh, Saudi Arabia" },
  { ats: "workable", board: "foodics", slug: "foodics", industry: "Restaurant SaaS", about: "Cloud point-of-sale and restaurant management platform.", domain: "foodics.com", name: "Foodics", color: "#7c3aed", hq: "Riyadh, Saudi Arabia" },
  { ats: "ashby", board: "leantech", slug: "lean-technologies", industry: "Fintech / Open banking", about: "Open banking and payment infrastructure for the Middle East.", name: "Lean Technologies", color: "#0f172a", hq: "Riyadh, Saudi Arabia" },
  { ats: "greenhouse", board: "bybit", slug: "bybit", industry: "Crypto exchange", about: "Cryptocurrency exchange for spot and derivatives trading.", domain: "bybit.com", name: "Bybit", color: "#d97706", hq: "Dubai, UAE" },
  { ats: "greenhouse", board: "binance", slug: "binance", industry: "Crypto exchange", about: "Large global cryptocurrency exchange and blockchain company.", domain: "binance.com", name: "Binance", color: "#ca8a04", hq: "Global" },
  { ats: "greenhouse", board: "deliveroo", slug: "deliveroo", industry: "Food delivery", about: "Food and grocery delivery platform with a tech hub in India.", domain: "deliveroo.com", name: "Deliveroo", color: "#0d9488", hq: "London, UK" },
  { ats: "greenhouse", board: "coinbase", slug: "coinbase", industry: "Crypto exchange", about: "Cryptocurrency exchange and financial infrastructure company.", domain: "coinbase.com", name: "Coinbase", color: "#2563eb", hq: "Remote" },
  { ats: "greenhouse", board: "inmobi", slug: "inmobi", industry: "Advertising technology", about: "Mobile advertising and marketing technology company.", domain: "inmobi.com", name: "InMobi", color: "#db2777", hq: "Bengaluru, India" },
  { ats: "smartrecruiters", board: "Freshworks", slug: "freshworks", industry: "SaaS", about: "Customer and employee engagement software.", domain: "freshworks.com", name: "Freshworks", color: "#ea580c", hq: "San Mateo, USA" },
  { ats: "smartrecruiters", board: "Swiggy", slug: "swiggy", industry: "Food delivery", about: "Food and grocery delivery platform in India.", domain: "swiggy.com", name: "Swiggy", color: "#f97316", hq: "Bengaluru, India" },
  { ats: "lever", board: "zeta", slug: "zeta", industry: "Banking technology", about: "Cloud-native banking and payments technology for banks.", domain: "zeta.tech", name: "Zeta", color: "#7e22ce", hq: "Bengaluru, India" },
  { ats: "lever", board: "paytm", slug: "paytm", industry: "Fintech / Payments", about: "Digital payments and financial services company in India.", domain: "paytm.com", name: "Paytm", color: "#0284c7", hq: "Noida, India" },
  { ats: "greenhouse", board: "thoughtworks", slug: "thoughtworks", domain: "thoughtworks.com", name: "Thoughtworks", color: "#be123c", hq: "Chicago, USA", industry: "Technology consulting", about: "Global software consultancy that builds products for large organisations." },
  { ats: "greenhouse", board: "mongodb", slug: "mongodb", domain: "mongodb.com", name: "MongoDB", color: "#15803d", hq: "New York, USA", industry: "Databases", about: "Company behind the MongoDB document database and Atlas cloud service." },
  { ats: "greenhouse", board: "gitlab", slug: "gitlab", domain: "gitlab.com", name: "GitLab", color: "#ea580c", hq: "Remote", industry: "Developer tools", about: "DevSecOps platform for building, securing and shipping software." },
  { ats: "greenhouse", board: "databricks", slug: "databricks", domain: "databricks.com", name: "Databricks", color: "#dc2626", hq: "San Francisco, USA", industry: "Data and AI", about: "Data and AI platform built around the lakehouse architecture." },
  { ats: "greenhouse", board: "stripe", slug: "stripe", domain: "stripe.com", name: "Stripe", color: "#4f46e5", hq: "San Francisco, USA", industry: "Fintech / Payments", about: "Payments and financial infrastructure for internet businesses." },
  { ats: "greenhouse", board: "twilio", slug: "twilio", domain: "twilio.com", name: "Twilio", color: "#e11d48", hq: "San Francisco, USA", industry: "Communications APIs", about: "Cloud APIs for messaging, voice and customer engagement." },
  { ats: "ashby", board: "snowflake", slug: "snowflake", domain: "snowflake.com", name: "Snowflake", color: "#0284c7", hq: "Bozeman, USA", industry: "Data and AI", about: "Cloud data platform for storing, sharing and analysing data." },
  { ats: "smartrecruiters", board: "endava", slug: "endava", domain: "endava.com", name: "Endava", color: "#ea580c", hq: "London, UK", industry: "Technology consulting", about: "Technology services company focused on digital transformation." },
  { ats: "greenhouse", board: "turing", slug: "turing", domain: "turing.com", name: "Turing", color: "#2563eb", hq: "Palo Alto, USA", industry: "AI / Talent platform", about: "AI company that also matches developers with remote roles." },
  { ats: "lever", board: "mindtickle", slug: "mindtickle", domain: "mindtickle.com", name: "Mindtickle", color: "#7c3aed", hq: "San Francisco, USA", industry: "SaaS", about: "Revenue enablement platform for sales teams." },
  { ats: "greenhouse", board: "druva", slug: "druva", domain: "druva.com", name: "Druva", color: "#0369a1", hq: "Santa Clara, USA", industry: "Data security", about: "Cloud platform for data protection and backup." },
  { ats: "smartrecruiters", board: "wise", slug: "wise", domain: "wise.com", name: "Wise", color: "#65a30d", hq: "London, UK", industry: "Fintech / Payments", about: "International money transfer and multi-currency accounts." },
  { ats: "greenhouse", board: "agoda", slug: "agoda", domain: "agoda.com", name: "Agoda", color: "#2563eb", hq: "Singapore", industry: "Travel technology", about: "Online travel platform for hotels and flights." },
  { ats: "greenhouse", board: "airbnb", slug: "airbnb", domain: "airbnb.com", name: "Airbnb", color: "#e11d48", hq: "San Francisco, USA", industry: "Travel technology", about: "Marketplace for stays and experiences." },
  { ats: "greenhouse", board: "elastic", slug: "elastic", domain: "elastic.co", name: "Elastic", color: "#0891b2", hq: "Remote", industry: "Search and observability", about: "Company behind Elasticsearch, for search, observability and security." },
];

// Older postings are usually stale even if still listed. Matches validThrough in the job page's JSON-LD.
const MAX_AGE_DAYS = 60;

const BOARD_URL = {
  greenhouse: (b) => `https://boards.greenhouse.io/${b}`,
  lever: (b) => `https://jobs.lever.co/${b}`,
  ashby: (b) => `https://jobs.ashbyhq.com/${b}`,
  smartrecruiters: (b) => `https://jobs.smartrecruiters.com/${b}`,
  workable: (b) => `https://apply.workable.com/${b}`,
};

const PLACES = [
  ["AE", /\b(uae|u\.a\.e|united arab emirates|dubai|abu dhabi|sharjah|ajman)\b/i, ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"]],
  ["SA", /\b(saudi|ksa|riyadh|jeddah|dammam|khobar)\b/i, ["Riyadh", "Jeddah", "Dammam", "Khobar"]],
  ["QA", /\b(qatar|doha)\b/i, ["Doha"]],
  ["KW", /\b(kuwait)\b/i, ["Kuwait City"]],
  ["OM", /\b(oman|muscat)\b/i, ["Muscat"]],
  ["BH", /\b(bahrain|manama)\b/i, ["Manama"]],
  ["IN", /\b(india|bengaluru|bangalore|mumbai|pune|gurugram|gurgaon|hyderabad|chennai|noida|delhi)\b/i, ["Bengaluru", "Bangalore", "Mumbai", "Pune", "Gurugram", "Gurgaon", "Hyderabad", "Chennai", "Noida", "Delhi"]],
];

// First match wins. Jobs matching nothing are not tech roles and are skipped.
const CATEGORIES = [
  ["security", /\b(security|soc analyst|cyber|appsec|infosec)\b/i],
  ["data-ai", /\b(data (engineer(ing)?|scien\w*|analy\w*)|machine learning|ml engineer|mlops|\bai\b|llm|analytics engineer|business intelligence)\b/i],
  ["devops", /\b(devops|sre|site reliability|platform engineer|infrastructure|cloud engineer)\b/i],
  ["qa", /\b(qa|sdet|test engineer|quality engineer|automation engineer)\b/i],
  ["erp", /\b(sap|oracle fusion|erp|dynamics 365)\b/i],
  ["network", /\b(network engineer|network administrator)\b/i],
  ["support", /\b(it support|helpdesk|help desk|technical support)\b/i],
  ["product", /\b(product manager|technical program manager|product owner)\b/i],
  ["frontend", /\b(front[- ]?end|react|angular|android|ios|flutter|mobile (engineer|developer))\b/i],
  ["backend", /\b(back[- ]?end|full[- ]?stack|software (engineer|developer)|sde|engineering manager|java|golang|node\.?js|\.net|python developer)\b/i],
];

const NON_TECH = /\b(sales|marketing|recruit\w*|talent|legal|finance|account(ant|ing)|customer success|business development|hr|human resources|martech|regional security)\b/i;

const TAGS = ["React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "Kotlin", "Swift", "Go", "Rust", ".NET", "C#", "Flutter", "Android", "iOS", "AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "Kafka", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Spark", "Databricks", "PyTorch", "TensorFlow", "LLM", "SQL", "SAP", "Selenium", "Cypress"];
// "Go" must not match prose such as "Go-to-market" or "Go to".
const tagRe = (t) => (t === "Go"
  ? /(^|[^A-Za-z0-9+#.])Go(?![- ]to\b)($|[^A-Za-z0-9+#])/
  : new RegExp(`(^|[^a-z0-9+#.])${t.replace(/[.+#]/g, "\\$&")}($|[^a-z0-9+#])`, "i"));

const toText = (html = "") => html
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
  .replace(/<\/(p|div|h[1-6]|ul|ol)>|<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "- ")
  .replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();

const CITY_ALIAS = { Bangalore: "Bengaluru", Gurgaon: "Gurugram" };

function seniorityOf(title) {
  if (/\b(intern|graduate|trainee)\b/i.test(title)) return "intern";
  if (/\b(junior|jr\.?|associate)\b/i.test(title)) return "junior";
  if (/\b(lead|staff|principal|head|manager|director|architect)\b/i.test(title)) return "lead";
  if (/\b(senior|sr\.?|sde[- ]?(3|iii))\b/i.test(title)) return "senior";
  return "mid";
}

// "Remote - Canada" is not open to someone in Dubai, so only unrestricted or regional remote counts.
function isOpenRemote(location, remote) {
  if (!remote && !/\bremote\b/i.test(location)) return false;
  const rest = location.replace(/\b(fully|remote)\b|[-,–()]/gi, "").trim();
  return !rest || /^(global|worldwide|anywhere|mena|middle east|gcc)$/i.test(rest);
}

function placeOf(location, remote) {
  for (const [country, re, cities] of PLACES) {
    if (re.test(location)) {
      const city = cities.find((c) => new RegExp(`\\b${c}\\b`, "i").test(location));
      return { country, city: CITY_ALIAS[city] ?? city };
    }
  }
  return isOpenRemote(location, remote) ? { country: "REMOTE" } : null;
}

const fetchers = {
  async greenhouse(board) {
    const { jobs } = await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
    return jobs.map((j) => ({
      sourceId: j.id, title: j.title, location: j.location?.name ?? "", url: j.absolute_url,
      postedAt: j.first_published ?? j.updated_at, description: toText(j.content),
    }));
  },
  async lever(board) {
    const jobs = await getJson(`https://api.lever.co/v0/postings/${board}?mode=json`);
    return jobs.map((j) => ({
      sourceId: j.id, title: j.text, location: (j.categories?.allLocations ?? [j.categories?.location]).filter(Boolean).join(", "), url: j.hostedUrl,
      postedAt: new Date(j.createdAt).toISOString(), workplace: j.workplaceType,
      description: [j.descriptionPlain, ...(j.lists ?? []).map((l) => `${l.text}\n${toText(l.content)}`), j.additionalPlain].filter(Boolean).join("\n\n"),
      salary: leverSalary(j.salaryRange),
    }));
  },
  async ashby(board) {
    const { jobs } = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
    return jobs.filter((j) => j.isListed !== false).map((j) => ({
      sourceId: j.id, title: j.title, location: [j.location, ...(j.secondaryLocations ?? []).map((l) => l.location)].filter(Boolean).join(", "), url: j.jobUrl,
      postedAt: j.publishedAt, workplace: j.workplaceType, remote: j.isRemote, description: j.descriptionPlain ?? toText(j.descriptionHtml),
    }));
  },
  async smartrecruiters(board) {
    const base = `https://api.smartrecruiters.com/v1/companies/${board}/postings`;
    const list = [];
    for (let offset = 0; ; offset += 100) {
      const page = await getJson(`${base}?limit=100&offset=${offset}`);
      list.push(...page.content);
      if (!page.content.length || list.length >= page.totalFound) break;
    }
    const located = list.map((j) => ({ ...j, place: [j.location?.city, COUNTRY_NAME[j.location?.country] ?? j.location?.country].filter(Boolean).join(", ") }));
    // Descriptions need one request per job, so fetch them only for jobs that will be kept.
    const wanted = located.filter((j) => isTech(j.name) && placeOf(j.place, j.location?.remote));
    const raw = [];
    for (const j of wanted) {
      const full = await getJson(`${base}/${j.id}`);
      raw.push({
        sourceId: j.id, title: j.name, location: j.place, url: full.postingUrl, postedAt: j.releasedDate, remote: j.location?.remote,
        description: Object.values(full.jobAd?.sections ?? {}).map((s) => `${s.title ?? ""}\n${toText(s.text)}`).join("\n\n"),
      });
    }
    return Object.assign(raw, { listed: list.length });
  },
  async workable(board) {
    const { jobs } = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${board}?details=true`);
    return jobs.map((j) => ({
      sourceId: j.shortcode, title: j.title, location: [j.city, j.state, j.country].filter(Boolean).join(", "), url: j.url,
      postedAt: j.published_on ?? j.created_at, remote: j.telecommuting, description: toText(j.description),
    }));
  },
};

function leverSalary(r) {
  const period = { "per-year-salary": "year", "per-month-salary": "month" }[r?.interval];
  return period && r.currency ? { min: r.min, max: r.max, currency: r.currency, period } : undefined;
}

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

const COUNTRY_NAME = { ae: "United Arab Emirates", sa: "Saudi Arabia", qa: "Qatar", kw: "Kuwait", om: "Oman", bh: "Bahrain", in: "India" };
const categoryOf = (title) => (NON_TECH.test(title) ? undefined : CATEGORIES.find(([, re]) => re.test(title))?.[0]);
const isTech = (title) => !!categoryOf(title);

function toJob(raw, source) {
  const category = categoryOf(raw.title);
  const place = placeOf(raw.location, raw.remote);
  // Without a real link or date the job cannot be traced to its source, so it is not published.
  if (!category || !place || !raw.url || !raw.postedAt) return null;
  if (Date.now() - new Date(raw.postedAt).getTime() > MAX_AGE_DAYS * 864e5) return null;
  const workplace = `${raw.workplace ?? ""} ${raw.location} ${raw.title}`;
  return {
    id: `${source.ats}-${source.board}-${raw.sourceId}`,
    source: source.ats, sourceId: String(raw.sourceId),
    company: source.name, companySlug: source.slug, title: raw.title,
    location: raw.location, ...(place.city && { city: place.city }), country: place.country,
    mode: place.country === "REMOTE" || raw.remote || /remote/i.test(workplace) ? "remote" : /hybrid/i.test(workplace) ? "hybrid" : "onsite",
    seniority: seniorityOf(raw.title), category,
    tags: TAGS.filter((t) => tagRe(t).test(`${raw.title}\n${raw.description}`)).slice(0, 8),
    ...(raw.salary && { salary: raw.salary }),
    // The APIs do not state these. False means "not stated", never inferred.
    visaSponsored: false, nationalsPreferred: false, directEmployer: true,
    description: raw.description, applyUrl: raw.url,
    postedAt: new Date(raw.postedAt).toISOString(), status: "active", synced: true,
  };
}

// Only the link is stored: the browser loads the icon, and nothing is downloaded here.
const logoUrl = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const removeDemo = args.includes("--remove-demo");
const only = args.find((a) => a.startsWith("--company="))?.split("=")[1];
const sources = SOURCES.filter((s) => !only || s.slug === only);
if (!sources.length) throw new Error(`Unknown company: ${only}`);

let db = null;
if (!dryRun) {
  const { applicationDefault, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: "techgulf-jobs" }));
}

// A source without these would show an empty company card, so stop before touching anything.
const incomplete = SOURCES.filter((s) => !s.industry || !s.about).map((s) => s.slug);
if (incomplete.length) throw new Error(`Add industry and about to SOURCES: ${incomplete.join(", ")}`);

// Written together and first, so a failed source or an interrupted run cannot leave companies incomplete.
if (db) {
  const batch = db.batch();
  for (const source of sources) {
    batch.set(db.collection("companies").doc(source.slug), {
      slug: source.slug, name: source.name, color: source.color, hq: source.hq,
      industry: source.industry, about: source.about,
      ats: source.ats, careersUrl: BOARD_URL[source.ats](source.board),
      // No domain means no usable icon, so the company keeps its letter avatar.
      ...(source.domain && { logo: logoUrl(source.domain) }),
    }, { merge: true });
  }
  await batch.commit();
  console.log(`Updated ${sources.length} companies`);
}

let failed = 0;
let total = 0;
for (const source of sources) {
  try {
    const raw = await fetchers[source.ats](source.board);
    // One posting listed in several cities has one id, so keep it once.
    const jobs = [...new Map(raw.map((r) => toJob(r, source)).filter(Boolean).map((j) => [j.id, j])).values()];
    console.log(`${source.name}: ${raw.listed ?? raw.length} fetched, ${jobs.length} kept`);
    total += jobs.length;

    if (dryRun) {
      for (const j of jobs.slice(0, 3)) console.log(`  [${j.category}/${j.country}/${j.city ?? "-"}/${j.mode}] ${j.title}\n    ${j.applyUrl}`);
      continue;
    }

    const writer = db.bulkWriter();
    for (const j of jobs) writer.set(db.collection("jobs").doc(j.id), j);

    // An empty response may be an API fault, so only a non-empty result can delete jobs.
    let deleted = 0;
    if (raw.listed ?? raw.length) {
      const live = new Set(jobs.map((j) => j.id));
      const existing = await db.collection("jobs").where("companySlug", "==", source.slug).where("synced", "==", true).get();
      for (const doc of existing.docs) {
        if (!live.has(doc.id)) { writer.delete(doc.ref); deleted++; }
      }
    }
    await writer.close();
    if (deleted) console.log(`  deleted ${deleted} jobs that expired or left the board`);
  } catch (err) {
    failed++;
    console.error(`${source.name}: FAILED, existing jobs left untouched. ${err.message}`);
  }
}

// A company dropped from SOURCES is no longer refreshed, so nothing else would ever remove its jobs.
if (db && !only) {
  const known = new Set(SOURCES.map((s) => s.slug));
  const synced = await db.collection("jobs").where("synced", "==", true).select("companySlug").get();
  const orphans = synced.docs.filter((d) => !known.has(d.get("companySlug")));
  if (orphans.length) {
    const writer = db.bulkWriter();
    for (const d of orphans) writer.delete(d.ref);
    await writer.close();
    console.log(`Deleted ${orphans.length} jobs from companies no longer in SOURCES`);
  }
}

console.log(`Done: ${total} jobs kept from ${sources.length - failed}/${sources.length} sources`);

if (removeDemo) {
  if (dryRun) console.log("--remove-demo ignored in dry run");
  else if (failed) console.log("--remove-demo skipped because a source failed");
  else {
    const all = await db.collection("jobs").get();
    const demo = all.docs.filter((d) => d.get("synced") !== true);
    const writer = db.bulkWriter();
    for (const d of demo) writer.delete(d.ref);
    await writer.close();
    console.log(`Removed ${demo.length} demo jobs`);
  }
}

if (failed) process.exitCode = 1;
