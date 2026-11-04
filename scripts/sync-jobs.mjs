// Syncs real jobs from public ATS APIs into Firestore.
//   npm run sync:jobs -- --dry-run                 preview, no credentials needed, writes nothing
//   npm run sync:jobs                              write jobs, close jobs that disappeared
//   npm run sync:jobs -- --remove-demo             also delete demo jobs (those not created by this script)
//   npm run sync:jobs -- --dry-run --company=careem
// Writing needs GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

// To add a company: find its board slug on its careers page and add one line.
const SOURCES = [
  { ats: "greenhouse", board: "careem", slug: "careem", name: "Careem", color: "#16a34a", hq: "Dubai, UAE" },
  { ats: "greenhouse", board: "tamara", slug: "tamara", name: "Tamara", color: "#7c3aed", hq: "Riyadh, Saudi Arabia" },
  { ats: "greenhouse", board: "groww", slug: "groww", name: "Groww", color: "#00b386", hq: "Bengaluru, India" },
  { ats: "ashby", board: "ziina", slug: "ziina", name: "Ziina", color: "#0f766e", hq: "Dubai, UAE" },
  { ats: "lever", board: "cred", slug: "cred", name: "CRED", color: "#1f2937", hq: "Bengaluru, India" },
  { ats: "lever", board: "meesho", slug: "meesho", name: "Meesho", color: "#9f2089", hq: "Bengaluru, India" },
];

const BOARD_URL = {
  greenhouse: (b) => `https://boards.greenhouse.io/${b}`,
  lever: (b) => `https://jobs.lever.co/${b}`,
  ashby: (b) => `https://jobs.ashbyhq.com/${b}`,
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

const NON_TECH = /\b(sales|marketing|recruit\w*|talent|legal|finance|account(ant|ing)|customer success|business development|hr|human resources)\b/i;

const TAGS = ["React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "Kotlin", "Swift", "Go", "Rust", ".NET", "C#", "Flutter", "Android", "iOS", "AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "Kafka", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Spark", "Databricks", "PyTorch", "TensorFlow", "LLM", "SQL", "SAP", "Selenium", "Cypress"];
const tagRe = (t) => new RegExp(`(^|[^a-z0-9+#.])${t.replace(/[.+#]/g, "\\$&")}($|[^a-z0-9+#])`, t === "Go" ? "" : "i");

const toText = (html = "") => html
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
  .replace(/<\/(p|div|h[1-6]|ul|ol)>|<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "- ")
  .replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();

function seniorityOf(title) {
  if (/\b(intern|graduate|trainee)\b/i.test(title)) return "intern";
  if (/\b(junior|jr\.?|associate)\b/i.test(title)) return "junior";
  if (/\b(lead|staff|principal|head|manager|director|architect)\b/i.test(title)) return "lead";
  if (/\b(senior|sr\.?|sde[- ]?(3|iii))\b/i.test(title)) return "senior";
  return "mid";
}

function placeOf(location) {
  for (const [country, re, cities] of PLACES) {
    if (re.test(location)) return { country, city: cities.find((c) => new RegExp(`\\b${c}\\b`, "i").test(location)) };
  }
  return /\bremote\b/i.test(location) && !/\b(us|usa|europe|emea|uk|latam)\b/i.test(location) ? { country: "REMOTE" } : null;
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

function toJob(raw, source) {
  const category = NON_TECH.test(raw.title) ? undefined : CATEGORIES.find(([, re]) => re.test(raw.title))?.[0];
  const place = placeOf(raw.location) ?? (raw.remote ? { country: "REMOTE" } : null);
  // Without a real link or date the job cannot be traced to its source, so it is not published.
  if (!category || !place || !raw.url || !raw.postedAt) return null;
  const workplace = `${raw.workplace ?? ""} ${raw.location}`;
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

let failed = 0;
for (const source of sources) {
  try {
    const raw = await fetchers[source.ats](source.board);
    const jobs = raw.map((r) => toJob(r, source)).filter(Boolean);
    console.log(`${source.name}: ${raw.length} fetched, ${jobs.length} kept`);

    if (dryRun) {
      for (const j of jobs.slice(0, 3)) console.log(`  [${j.category}/${j.country}/${j.city ?? "-"}/${j.mode}] ${j.title}\n    ${j.applyUrl}`);
      continue;
    }

    const writer = db.bulkWriter();
    writer.set(db.collection("companies").doc(source.slug), {
      slug: source.slug, name: source.name, color: source.color, hq: source.hq,
      ats: source.ats, careersUrl: BOARD_URL[source.ats](source.board),
    }, { merge: true });
    for (const j of jobs) writer.set(db.collection("jobs").doc(j.id), j);

    // An empty response may be an API fault, so only a non-empty result can close jobs.
    let closed = 0;
    if (raw.length) {
      const live = new Set(jobs.map((j) => j.id));
      const existing = await db.collection("jobs").where("companySlug", "==", source.slug).where("synced", "==", true).get();
      for (const doc of existing.docs) {
        if (!live.has(doc.id) && doc.get("status") === "active") { writer.update(doc.ref, { status: "closed" }); closed++; }
      }
    }
    await writer.close();
    if (closed) console.log(`  closed ${closed} jobs no longer listed`);
  } catch (err) {
    failed++;
    console.error(`${source.name}: FAILED, existing jobs left untouched. ${err.message}`);
  }
}

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
