// Publishes salaries shared by users: reads private salaryReports, writes only aggregates to market/current.
//   npm run sync:salaries -- --dry-run      preview, writes nothing
//   npm run sync:salaries                   replace the published salaries, removing any demo data
// Needs GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { aggregateSalaries } from "../lib/format.ts";

const dryRun = process.argv.includes("--dry-run");
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: "techgulf-jobs" }));

const [reportSnap, citySnap] = await Promise.all([db.collection("salaryReports").get(), db.collection("cities").get()]);
const { benchmarks, sampleSize, pending } = aggregateSalaries(reportSnap.docs.map((d) => d.data()), citySnap.docs.map((d) => d.data()));

console.log(`${reportSnap.size} reports, ${sampleSize} published in ${benchmarks.length} benchmarks`);
for (const b of benchmarks) console.log(`  ${b.role} / ${b.city}: ${b.currency} ${b.p25} / ${b.p50} / ${b.p75} per ${b.period} (${b.sample} people)`);
for (const [group, n] of Object.entries(pending)) console.log(`  waiting: ${group} has ${n}`);

if (dryRun) {
  console.log("Dry run: nothing written");
} else {
  // Trends and notes were demo data: nothing real feeds them yet.
  await db.doc("market/current").set({
    benchmarks, sampleSize, yoy: {}, techTrends: [], notes: [], trendMonths: [],
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  console.log("Wrote market/current");
}
