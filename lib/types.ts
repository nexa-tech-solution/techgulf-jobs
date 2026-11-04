export type Country = "AE" | "SA" | "QA" | "KW" | "OM" | "BH" | "IN" | "REMOTE";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type Seniority = "intern" | "junior" | "mid" | "senior" | "lead";
export type Category =
  | "backend" | "frontend" | "data-ai" | "devops" | "security" | "erp"
  | "qa" | "network" | "product" | "support" | "other";
export type Source = "greenhouse" | "lever" | "ashby" | "workday" | "careers" | "careerjet" | "jooble" | "direct";

export interface Salary { min?: number; max?: number; currency: string; period: "year" | "month" }

export interface RawJob {
  source: "greenhouse" | "lever" | "ashby";
  sourceId: string; company: string; companySlug: string; title: string; location: string;
  descriptionHtml: string; applyUrl: string; postedAt?: string; salary?: Salary; workplaceType?: string;
}

export interface Company {
  slug: string; name: string; color: string; size: string; industry: string;
  hq: string; ats: Source; careersUrl: string; about: string;
}

export interface Job {
  id: string; source: Source; company: string; companySlug: string; title: string;
  location: string; city?: string; country?: Country; mode: WorkMode; seniority: Seniority;
  category: Category; tags: string[]; salary?: Salary; visaSponsored: boolean;
  nationalsPreferred: boolean; directEmployer: boolean; featured?: boolean; experience?: string;
  description: string; applyUrl: string; postedAt: string;
  companyColor?: string;
}

export interface City { slug: string; name: string; country: Country; ar: string }
export interface SalaryBenchmark { role: string; category: Category; city: string; currency: string; p25: number; p50: number; p75: number; period: "month" | "year" }
export interface TechTrend { tech: string; demand: number; premium: number; jobs: number; category: Category }
export interface MarketNote { date: string; text: string }
export interface MarketData {
  benchmarks: SalaryBenchmark[]; techTrends: TechTrend[]; notes: MarketNote[];
  trendMonths: string[]; yoy: Record<string, number>; sampleSize: number; updatedAt: string;
}

export type Region = "UAE" | "KSA" | "QA" | "IN";
export interface Guide { region: Region; title: string; summary: string; mins: number; updated: string; steps: string[] }
export interface JourneyStep { t: string; s: string; d: string }
export interface CostRow { city: string; cur: string; rent: number; transport: number; food: number; salary: number }
export interface GuidesContent { guides: Guide[]; journey: JourneyStep[]; cost: CostRow[] }
