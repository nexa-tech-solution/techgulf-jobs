import type { Category, Company, Country, Job, Salary, Seniority, Source, WorkMode } from "./types";

// Fixed "today" keeps pages static/deterministic. Replace with real data later.
export const TODAY = new Date("2026-11-03T08:00:00Z");

export const COMPANIES: Company[] = [
  { slug: "careem", name: "Careem", color: "#16a34a", size: "1,000–5,000", industry: "Super-app / Mobility", hq: "Dubai, UAE", ats: "greenhouse", careersUrl: "https://careers.careem.com", about: "The everything app for the greater Middle East — rides, food, payments and more." },
  { slug: "tamara", name: "Tamara", color: "#7c3aed", size: "500–1,000", industry: "Fintech / BNPL", hq: "Riyadh, Saudi Arabia", ats: "greenhouse", careersUrl: "https://tamara.co/careers", about: "Saudi buy-now-pay-later fintech serving millions of shoppers across the GCC." },
  { slug: "tabby", name: "Tabby", color: "#0ea5e9", size: "500–1,000", industry: "Fintech", hq: "Dubai, UAE", ats: "ashby", careersUrl: "https://tabby.ai/careers", about: "Shopping and financial services app operating in UAE and Saudi Arabia." },
  { slug: "noon", name: "Noon", color: "#eab308", size: "5,000+", industry: "E-commerce", hq: "Dubai, UAE", ats: "workday", careersUrl: "https://noon.com/careers", about: "The region's homegrown digital marketplace." },
  { slug: "talabat", name: "Talabat", color: "#f97316", size: "5,000+", industry: "Food delivery", hq: "Dubai, UAE", ats: "workday", careersUrl: "https://careers.talabat.com", about: "Leading on-demand food and grocery delivery platform in the Middle East." },
  { slug: "g42", name: "G42", color: "#0f172a", size: "5,000+", industry: "AI", hq: "Abu Dhabi, UAE", ats: "careers", careersUrl: "https://g42.ai/careers", about: "Abu Dhabi-based AI and cloud computing group." },
  { slug: "stc", name: "stc", color: "#6d28d9", size: "10,000+", industry: "Telecom", hq: "Riyadh, Saudi Arabia", ats: "careers", careersUrl: "https://stc.com.sa/careers", about: "Saudi Arabia's largest telecom and digital services provider." },
  { slug: "emirates-nbd", name: "Emirates NBD", color: "#1d4ed8", size: "10,000+", industry: "Banking", hq: "Dubai, UAE", ats: "workday", careersUrl: "https://emiratesnbd.com/careers", about: "One of the largest banking groups in the region." },
  { slug: "foodics", name: "Foodics", color: "#db2777", size: "500–1,000", industry: "Restaurant SaaS", hq: "Riyadh, Saudi Arabia", ats: "lever", careersUrl: "https://foodics.com/careers", about: "Cloud POS and restaurant management platform." },
  { slug: "qnb", name: "QNB", color: "#7f1d1d", size: "10,000+", industry: "Banking", hq: "Doha, Qatar", ats: "careers", careersUrl: "https://qnb.com/careers", about: "Largest financial institution in the Middle East and Africa." },
  { slug: "razorpay", name: "Razorpay", color: "#2563eb", size: "1,000–5,000", industry: "Fintech", hq: "Bengaluru, India", ats: "lever", careersUrl: "https://razorpay.com/jobs", about: "Full-stack payments and banking platform for Indian businesses." },
  { slug: "swiggy", name: "Swiggy", color: "#ea580c", size: "5,000+", industry: "Food delivery", hq: "Bengaluru, India", ats: "careers", careersUrl: "https://careers.swiggy.com", about: "India's on-demand convenience platform." },
  { slug: "postman", name: "Postman", color: "#ef4444", size: "500–1,000", industry: "Developer tools", hq: "Bengaluru, India", ats: "greenhouse", careersUrl: "https://postman.com/company/careers", about: "The world's leading API platform." },
  { slug: "freshworks", name: "Freshworks", color: "#22c55e", size: "5,000+", industry: "SaaS", hq: "Chennai, India", ats: "careers", careersUrl: "https://freshworks.com/company/careers", about: "Customer and employee engagement software." },
  { slug: "gulf-it-staffing", name: "Gulf IT Staffing", color: "#64748b", size: "50–200", industry: "Recruitment agency", hq: "Sharjah, UAE", ats: "direct", careersUrl: "#", about: "IT recruitment agency." },
];

type Row = [string, string, Country | "REMOTE", string | undefined, WorkMode, Seniority, Category, string[], Salary | undefined, string, number, ...Partial<[boolean, boolean, boolean, boolean]>];
// [company, title, country, city, mode, seniority, category, tags, salary, experience, daysAgo, visa, nationals, featured, agency]
const S = (min: number, max: number, currency: string, period: "year" | "month" = "month"): Salary => ({ min, max, currency, period });

const ROWS: Row[] = [
  ["careem", "Senior Backend Engineer (Go)", "AE", "Dubai", "hybrid", "senior", "backend", ["Go", "Kafka", "PostgreSQL"], S(32000, 42000, "AED"), "5–8 yrs", 1, true, false, true],
  ["tamara", "Senior React Developer", "SA", "Riyadh", "onsite", "senior", "frontend", ["React", "TypeScript", "Next.js"], S(28000, 36000, "SAR"), "5+ yrs", 2, true],
  ["tabby", "Machine Learning Engineer – Risk", "AE", "Dubai", "hybrid", "mid", "data-ai", ["Python", "PyTorch", "Spark"], S(30000, 40000, "AED"), "3–6 yrs", 0, true, false, true],
  ["g42", "LLM Research Engineer", "AE", "Abu Dhabi", "onsite", "senior", "data-ai", ["LLM", "PyTorch", "Kubernetes"], S(45000, 60000, "AED"), "5+ yrs", 3, true],
  ["noon", "DevOps Engineer (AWS)", "AE", "Dubai", "onsite", "mid", "devops", ["AWS", "Terraform", "Kubernetes"], undefined, "3–5 yrs", 4, true],
  ["stc", "SOC Analyst L2", "SA", "Riyadh", "onsite", "mid", "security", ["SIEM", "Splunk", "NCA ECC"], S(18000, 24000, "SAR"), "3+ yrs", 2, false, true],
  ["stc", "Graduate Software Engineer Program", "SA", "Riyadh", "onsite", "intern", "backend", ["Java", "Spring"], S(9000, 11000, "SAR"), "0–1 yrs", 6, false, true],
  ["emirates-nbd", ".NET Core Developer", "AE", "Dubai", "onsite", "mid", "backend", [".NET", "C#", "Azure"], S(22000, 28000, "AED"), "4–7 yrs", 5, true],
  ["emirates-nbd", "SAP S/4HANA FICO Consultant", "AE", "Dubai", "onsite", "senior", "erp", ["SAP", "S/4HANA"], undefined, "7+ yrs", 9],
  ["talabat", "Senior Android Engineer (Kotlin)", "AE", "Dubai", "hybrid", "senior", "frontend", ["Kotlin", "Android", "Jetpack"], S(30000, 38000, "AED"), "5+ yrs", 1, true],
  ["talabat", "Data Engineer", "KW", "Kuwait City", "hybrid", "mid", "data-ai", ["Spark", "Databricks", "Python"], S(1300, 1700, "KWD"), "3–5 yrs", 3, true],
  ["foodics", "Flutter Developer – Arabic-first apps", "SA", "Riyadh", "hybrid", "mid", "frontend", ["Flutter", "Dart"], S(16000, 22000, "SAR"), "2–5 yrs", 2, true],
  ["foodics", "QA Automation Engineer", "SA", "Riyadh", "remote", "mid", "qa", ["Cypress", "Selenium", "Appium"], S(14000, 18000, "SAR"), "3+ yrs", 7],
  ["qnb", "Cybersecurity Architect", "QA", "Doha", "onsite", "lead", "security", ["ISO 27001", "Zero Trust"], S(35000, 45000, "QAR"), "10+ yrs", 4, true],
  ["qnb", "Oracle Fusion Technical Lead", "QA", "Doha", "onsite", "lead", "erp", ["Oracle Fusion", "OIC"], undefined, "8+ yrs", 12],
  ["careem", "Product Manager – Payments", "AE", "Dubai", "hybrid", "senior", "product", ["Fintech", "Figma"], S(38000, 48000, "AED"), "5+ yrs", 5, true],
  ["g42", "Site Reliability Engineer", "AE", "Abu Dhabi", "onsite", "senior", "devops", ["Kubernetes", "GCP", "Prometheus"], undefined, "5+ yrs", 8, true],
  ["stc", "5G Core Network Engineer", "SA", "Jeddah", "onsite", "mid", "network", ["5G", "Ericsson", "CCNP"], S(17000, 23000, "SAR"), "4+ yrs", 10],
  ["gulf-it-staffing", "IT Helpdesk Engineer", "AE", "Sharjah", "onsite", "junior", "support", ["ITIL", "ServiceNow"], S(5000, 7000, "AED"), "1–3 yrs", 15, false, false, false, true],
  ["gulf-it-staffing", "Network Administrator (Fortinet)", "OM", "Muscat", "onsite", "mid", "network", ["Fortinet", "CCNA"], S(900, 1200, "OMR"), "3+ yrs", 34, false, false, false, true],
  ["tabby", "Staff Backend Engineer (Node.js)", "REMOTE", undefined, "remote", "lead", "backend", ["Node.js", "TypeScript", "AWS"], S(90000, 120000, "USD", "year"), "8+ yrs", 2, false, false, true],
  ["tamara", "Senior Data Scientist", "AE", "Dubai", "hybrid", "senior", "data-ai", ["Python", "SQL", "LLM"], S(30000, 38000, "AED"), "5+ yrs", 6, true],
  ["noon", "Engineering Manager – Search", "SA", "Riyadh", "onsite", "lead", "backend", ["Java", "Elasticsearch"], undefined, "10+ yrs", 11, true],
  ["razorpay", "SDE-2 Backend (Java)", "IN", "Bengaluru", "hybrid", "mid", "backend", ["Java", "Spring", "MySQL"], S(28e5, 40e5, "INR", "year"), "3–5 yrs", 1, false, false, true],
  ["razorpay", "Senior Frontend Engineer", "IN", "Bengaluru", "hybrid", "senior", "frontend", ["React", "TypeScript"], S(35e5, 50e5, "INR", "year"), "5+ yrs", 4],
  ["swiggy", "Applied Scientist – Recommendations", "IN", "Bengaluru", "onsite", "senior", "data-ai", ["PyTorch", "Spark", "LLM"], S(45e5, 70e5, "INR", "year"), "5+ yrs", 3],
  ["swiggy", "SRE – Platform", "IN", "Hyderabad", "hybrid", "mid", "devops", ["AWS", "Kubernetes", "Go"], S(25e5, 38e5, "INR", "year"), "3–6 yrs", 5],
  ["postman", "Security Engineer (AppSec)", "IN", "Bengaluru", "remote", "senior", "security", ["AppSec", "Node.js"], S(40e5, 60e5, "INR", "year"), "5+ yrs", 2],
  ["postman", "Product Designer", "IN", "Bengaluru", "hybrid", "mid", "product", ["Figma", "UX research"], S(20e5, 32e5, "INR", "year"), "3+ yrs", 8],
  ["freshworks", "QA Engineer – Mobile", "IN", "Chennai", "onsite", "junior", "qa", ["Appium", "Selenium"], S(6e5, 10e5, "INR", "year"), "1–3 yrs", 7],
  ["freshworks", "Salesforce Developer", "IN", "Hyderabad", "hybrid", "mid", "erp", ["Salesforce", "Apex"], undefined, "3–6 yrs", 13],
  ["careem", "Senior iOS Engineer (Swift)", "IN", "Bengaluru", "hybrid", "senior", "frontend", ["Swift", "iOS"], S(40e5, 55e5, "INR", "year"), "5+ yrs", 2],
  ["tabby", "Backend Engineer (Python) – relocate to Dubai", "AE", "Dubai", "onsite", "mid", "backend", ["Python", "Django", "PostgreSQL"], S(24000, 32000, "AED"), "3–6 yrs", 1, true],
  ["g42", "Cloud Architect (Azure)", "AE", "Abu Dhabi", "onsite", "lead", "devops", ["Azure", "Terraform"], S(50000, 65000, "AED"), "10+ yrs", 9, true],
  ["emirates-nbd", "UAE National Graduate – Technology", "AE", "Dubai", "onsite", "intern", "support", ["ITIL"], S(15000, 18000, "AED"), "0–1 yrs", 4, false, true],
  ["qnb", "Data Analyst (Power BI)", "BH", "Manama", "onsite", "junior", "data-ai", ["Power BI", "SQL"], S(900, 1200, "BHD"), "1–3 yrs", 6],
];

const SOURCE_BY_ATS = (c: Company): Source => c.ats;

function description(title: string, company: string, tags: string[], visa: boolean): string {
  return `About the role
${company} is hiring a ${title} to help build products used by millions across the region. You will own services end to end, work closely with product and design, and ship weekly.

What you'll do
• Design, build and operate production systems using ${tags.join(", ")}.
• Collaborate with cross-functional teams across Dubai, Riyadh and Bengaluru.
• Improve reliability, performance and developer experience.
• Mentor teammates and contribute to engineering standards.

What we're looking for
• Strong hands-on experience with ${tags.slice(0, 2).join(" and ")}.
• Clear written and spoken English; Arabic is a plus.
• Ownership mindset and comfort with ambiguity.

Benefits
• Competitive tax-free salary, annual bonus and flights home.
• Private medical insurance for you and your family.
${visa ? "• Full visa sponsorship and relocation package.\n" : ""}• Flexible working and learning budget.`;
}

export const JOBS: Job[] = ROWS.map((r, i) => {
  const [cs, title, country, city, mode, seniority, category, tags, salary, experience, days, visa = false, nationals = false, featured = false, agency = false] = r;
  const c = COMPANIES.find((x) => x.slug === cs)!;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `${cs}-${slug}-${1000 + i}`,
    source: agency ? "careerjet" : SOURCE_BY_ATS(c),
    company: c.name, companySlug: cs, title,
    location: city ?? "Remote", city, country: country as Country,
    mode, seniority, category, tags, salary,
    visaSponsored: visa, nationalsPreferred: nationals, directEmployer: !agency, featured,
    experience, description: description(title, c.name, tags, visa),
    applyUrl: c.careersUrl,
    postedAt: new Date(TODAY.getTime() - days * 864e5).toISOString(),
  };
});

export const CITIES = [
  { slug: "dubai", name: "Dubai", country: "AE" as Country, ar: "دبي" },
  { slug: "abu-dhabi", name: "Abu Dhabi", country: "AE" as Country, ar: "أبوظبي" },
  { slug: "riyadh", name: "Riyadh", country: "SA" as Country, ar: "الرياض" },
  { slug: "jeddah", name: "Jeddah", country: "SA" as Country, ar: "جدة" },
  { slug: "doha", name: "Doha", country: "QA" as Country, ar: "الدوحة" },
  { slug: "kuwait-city", name: "Kuwait City", country: "KW" as Country, ar: "مدينة الكويت" },
  { slug: "bengaluru", name: "Bengaluru", country: "IN" as Country, ar: "بنغالور" },
  { slug: "hyderabad", name: "Hyderabad", country: "IN" as Country, ar: "حيدر آباد" },
];

// Salary benchmarks (monthly, local currency) — illustrative only
export const SALARY_BENCHMARKS: { role: string; category: Category; city: string; currency: string; p25: number; p50: number; p75: number; period: "month" | "year" }[] = [
  { role: "Backend Engineer", category: "backend", city: "Dubai", currency: "AED", p25: 20000, p50: 27000, p75: 36000, period: "month" },
  { role: "Backend Engineer", category: "backend", city: "Riyadh", currency: "SAR", p25: 18000, p50: 25000, p75: 33000, period: "month" },
  { role: "Backend Engineer", category: "backend", city: "Bengaluru", currency: "INR", p25: 18e5, p50: 30e5, p75: 45e5, period: "year" },
  { role: "Frontend Engineer", category: "frontend", city: "Dubai", currency: "AED", p25: 18000, p50: 25000, p75: 33000, period: "month" },
  { role: "Frontend Engineer", category: "frontend", city: "Bengaluru", currency: "INR", p25: 14e5, p50: 26e5, p75: 40e5, period: "year" },
  { role: "DevOps Engineer", category: "devops", city: "Dubai", currency: "AED", p25: 22000, p50: 30000, p75: 40000, period: "month" },
  { role: "DevOps Engineer", category: "devops", city: "Riyadh", currency: "SAR", p25: 20000, p50: 28000, p75: 36000, period: "month" },
  { role: "Data Scientist", category: "data-ai", city: "Dubai", currency: "AED", p25: 24000, p50: 32000, p75: 42000, period: "month" },
  { role: "Data Scientist", category: "data-ai", city: "Bengaluru", currency: "INR", p25: 20e5, p50: 35e5, p75: 55e5, period: "year" },
  { role: "Cybersecurity Analyst", category: "security", city: "Riyadh", currency: "SAR", p25: 15000, p50: 21000, p75: 29000, period: "month" },
  { role: "Cybersecurity Analyst", category: "security", city: "Doha", currency: "QAR", p25: 18000, p50: 25000, p75: 34000, period: "month" },
  { role: "SAP Consultant", category: "erp", city: "Dubai", currency: "AED", p25: 25000, p50: 34000, p75: 45000, period: "month" },
  { role: "QA Engineer", category: "qa", city: "Riyadh", currency: "SAR", p25: 11000, p50: 15000, p75: 20000, period: "month" },
  { role: "Product Manager", category: "product", city: "Dubai", currency: "AED", p25: 28000, p50: 38000, p75: 50000, period: "month" },
];

// ---------- Salary trends (illustrative) ----------
export const SALARY_UPDATED = "2026-11-03";
export const SALARY_SAMPLE = 4812;
export const TREND_MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

/** Year-over-year change of the median, in % — keyed by `${role}|${city}` */
export const YOY: Record<string, number> = {
  "Backend Engineer|Dubai": 4.2, "Backend Engineer|Riyadh": 5.1, "Backend Engineer|Bengaluru": 7.5,
  "Frontend Engineer|Dubai": 2.8, "Frontend Engineer|Bengaluru": 3.1, "DevOps Engineer|Dubai": 6.4,
  "DevOps Engineer|Riyadh": 8.2, "Data Scientist|Dubai": 9.6, "Data Scientist|Bengaluru": 14.8,
  "Cybersecurity Analyst|Riyadh": 11.3, "Cybersecurity Analyst|Doha": 6.9, "SAP Consultant|Dubai": 3.4,
  "QA Engineer|Riyadh": -1.2, "Product Manager|Dubai": 4.0,
};


/** Fixed categorical colour per city (validated palette; colour follows the entity, not rank). */
export const CITY_COLOR: Record<string, { light: string; dark: string }> = {
  Dubai: { light: "#2a78d6", dark: "#3987e5" },
  Riyadh: { light: "#eb6834", dark: "#d95926" },
  Doha: { light: "#1baf7a", dark: "#199e70" },
  Bengaluru: { light: "#eda100", dark: "#c98500" },
};

export const TECH_TRENDS: { tech: string; demand: number; premium: number; jobs: number; category: Category }[] = [
  { tech: "LLM / GenAI", demand: 82, premium: 28, jobs: 3420, category: "data-ai" },
  { tech: "Kubernetes", demand: 31, premium: 14, jobs: 5120, category: "devops" },
  { tech: "Go", demand: 27, premium: 12, jobs: 2210, category: "backend" },
  { tech: "Rust", demand: 24, premium: 15, jobs: 640, category: "backend" },
  { tech: "Databricks", demand: 22, premium: 11, jobs: 1380, category: "data-ai" },
  { tech: "SAP S/4HANA", demand: 18, premium: 19, jobs: 2950, category: "erp" },
  { tech: "Zero Trust / NCA ECC", demand: 17, premium: 13, jobs: 1640, category: "security" },
  { tech: "Flutter", demand: 9, premium: 2, jobs: 1890, category: "frontend" },
  { tech: "React", demand: 4, premium: 3, jobs: 7850, category: "frontend" },
  { tech: "Angular", demand: -8, premium: -2, jobs: 2430, category: "frontend" },
  { tech: "Manual QA", demand: -15, premium: -12, jobs: 1210, category: "qa" },
];

export const MARKET_NOTES: { date: string; text: string }[] = [
  { date: "2026-11-01", text: "AI/ML roles in Dubai now list salary 41% of the time — highest of any field." },
  { date: "2026-10-24", text: "Riyadh DevOps medians up 8% YoY as new data-centre projects hire ahead of 2027." },
  { date: "2026-10-15", text: "Bengaluru data scientists at 20+ LPA grew fastest; sub-10 LPA roles flat." },
];
