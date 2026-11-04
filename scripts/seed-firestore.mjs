// Copies lib/mock-data.ts into Firestore. Demo data only; re-running overwrites the same documents.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npm run seed
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  CITIES, COMPANIES, JOBS, MARKET_NOTES, SALARY_BENCHMARKS, SALARY_SAMPLE, SALARY_UPDATED, TECH_TRENDS, TREND_MONTHS, YOY,
} from "../lib/mock-data.ts";
import { COST, GUIDES, JOURNEY, POSTS } from "../lib/seed-content.ts";

const projectId = "techgulf-jobs";
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId }));
const clean = (value) => JSON.parse(JSON.stringify(value)); // Firestore rejects undefined fields

const writes = [
  ...COMPANIES.map((c) => [db.collection("companies").doc(c.slug), clean(c)]),
  ...JOBS.map((j) => [db.collection("jobs").doc(j.id), { ...clean(j), status: "active" }]),
  ...CITIES.map((c) => [db.collection("cities").doc(c.slug), clean(c)]),
  ...POSTS.map((p) => [db.collection("posts").doc(p.slug), clean(p)]),
  [db.collection("content").doc("guides"), clean({ guides: GUIDES, journey: JOURNEY, cost: COST })],
  [db.collection("market").doc("current"), clean({
    benchmarks: SALARY_BENCHMARKS, techTrends: TECH_TRENDS, notes: MARKET_NOTES, trendMonths: TREND_MONTHS,
    yoy: YOY, sampleSize: SALARY_SAMPLE, updatedAt: SALARY_UPDATED,
  })],
];

const writer = db.bulkWriter();
for (const [ref, data] of writes) writer.set(ref, data);
await writer.close();

console.log(`Seeded ${COMPANIES.length} companies, ${JOBS.length} jobs, ${CITIES.length} cities, ${POSTS.length} posts, guides and market data into ${projectId}`);
