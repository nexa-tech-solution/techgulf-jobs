// Emails each opted-in user the new jobs that match them.
//   npm run digest -- --preview=/path/file.html   render a sample, no credentials needed, sends nothing
//   npm run digest -- --dry-run                   list who would get what, sends and writes nothing
//   npm run digest                                send
// Sending needs RESEND_API_KEY and MAIL_FROM in .env, plus Firebase credentials as for sync:jobs.
//
// Only users with profile.emailDigest === true are emailed. A job is "new" until it has notifiedAt.
// The first run only marks existing jobs, so nobody is sent the whole catalogue.
import { writeFileSync } from "node:fs";
import { renderDigest } from "./email-template.mjs";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://techgulfjobs.com").replace(/\/$/, "");
const MAX_JOBS = 5;
// Levels that fit each experience option on the profile form.
const LEVELS_FOR_YEARS = { "0-1": ["intern", "junior"], "1-3": ["junior", "mid"], "3-5": ["mid", "senior"], "5-8": ["mid", "senior", "lead"], "8+": ["senior", "lead"] };
const COUNTRY_NAME = { AE: "UAE", SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait", OM: "Oman", BH: "Bahrain", IN: "India", REMOTE: "Remote" };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const previewPath = args.find((a) => a.startsWith("--preview="))?.split("=")[1];
const today = new Date().toISOString().slice(0, 10);

/** Jobs in the user's countries, at a level fitting their experience, that name at least one of their skills. Best match first. */
export function jobsForUser(jobs, profile) {
  const skills = new Set(profile.skills ?? []);
  const targets = new Set(profile.targets ?? []);
  const levels = LEVELS_FOR_YEARS[profile.years];
  return jobs
    .filter((j) => targets.has(j.country) && (!levels || levels.includes(j.seniority)))
    .map((j) => ({ ...j, matched: (j.tags ?? []).filter((t) => skills.has(t)), countryName: j.country === "REMOTE" ? "" : COUNTRY_NAME[j.country] }))
    .filter((j) => j.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length || b.postedAt.localeCompare(a.postedAt));
}

async function send({ to, subject, html, text, settingsUrl }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html, text, headers: { "List-Unsubscribe": `<${settingsUrl}>` } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
}

if (previewPath) {
  const jobs = [
    { id: "sample-1", title: "Senior Backend Engineer", company: "Careem", city: "Dubai", countryName: "UAE", matched: ["Go", "Kafka", "AWS"] },
    { id: "sample-2", title: "Staff Data Engineer", company: "Tamara", city: "Riyadh", countryName: "Saudi Arabia", matched: ["Python", "Spark"] },
    { id: "sample-3", title: "Platform Engineer", company: "GitLab", city: "Bengaluru", countryName: "India", matched: ["Kubernetes"] },
  ];
  writeFileSync(previewPath, renderDigest({ name: "Sample User", jobs, total: 3, siteUrl: SITE_URL }).html);
  console.log(`Preview written to ${previewPath}`);
  process.exit(0);
}

if (!dryRun && (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM)) {
  throw new Error("Add RESEND_API_KEY and MAIL_FROM to .env, or use --dry-run.");
}

const { applicationDefault, initializeApp } = await import("firebase-admin/app");
const { FieldValue, getFirestore } = await import("firebase-admin/firestore");
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: "techgulf-jobs" }));

const jobSnap = await db.collection("jobs").where("status", "==", "active").get();
const pending = jobSnap.docs.filter((d) => !d.get("notifiedAt"));
const stateRef = db.collection("meta").doc("digest");
const baselineDone = (await stateRef.get()).exists;

async function markNotified(docs) {
  const writer = db.bulkWriter();
  for (const d of docs) writer.update(d.ref, { notifiedAt: new Date().toISOString() });
  await writer.close();
}

if (!baselineDone) {
  console.log(`First run: ${pending.length} existing jobs ${dryRun ? "would be" : "are"} marked as already seen. No emails on this run.`);
  if (!dryRun) {
    await markNotified(pending);
    await stateRef.set({ baselineAt: new Date().toISOString() });
  }
  process.exit(0);
}

const newJobs = pending.map((d) => ({ ...d.data(), id: d.id }));
console.log(`${newJobs.length} new jobs`);
if (!newJobs.length) process.exit(0);

const userSnap = await db.collection("users").where("profile.emailDigest", "==", true).get();
// Records who was emailed today, so running twice in a day cannot send twice.
const runRef = db.collection("digestRuns").doc(today);
const alreadySent = new Set((await runRef.get()).data()?.sent ?? []);

let sent = 0, skipped = 0, failed = 0;
for (const user of userSnap.docs) {
  const { email, profile } = user.data();
  const matches = jobsForUser(newJobs, profile);
  if (!email || !matches.length || alreadySent.has(user.id)) { skipped++; continue; }
  const message = renderDigest({ name: profile.name, jobs: matches.slice(0, MAX_JOBS), total: Math.min(matches.length, MAX_JOBS), siteUrl: SITE_URL });
  if (dryRun) { console.log(`Would email user ${user.id}: ${message.subject}`); sent++; continue; }
  try {
    await send({ to: email, ...message, settingsUrl: `${SITE_URL}/en/onboarding#email-digest` });
    await runRef.set({ sent: FieldValue.arrayUnion(user.id) }, { merge: true });
    sent++;
  } catch (err) {
    failed++;
    console.error(`User ${user.id}: not sent. ${err.message}`);
  }
}

console.log(`${dryRun ? "Would send" : "Sent"} ${sent}, skipped ${skipped}, failed ${failed}, of ${userSnap.size} opted-in users`);
// After a failure jobs stay new, so a rerun retries; people already emailed today are skipped.
if (failed) process.exitCode = 1;
else if (!dryRun) await markNotified(pending);
