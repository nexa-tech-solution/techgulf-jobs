// Emails each user the new jobs that match them.
//   npm run digest -- --preview=/path/file.html   render a sample, no credentials needed, sends nothing
//   npm run digest -- --dry-run                   list who would get what, sends and writes nothing
//   npm run digest                                send
// Sending needs GMAIL_USER and GMAIL_APP_PASSWORD in .env, plus Firebase credentials as for sync:jobs.
//
// Every user with a profile is emailed, unless they turned it off (profile.emailDigest === false). A job is "new" until it has notifiedAt.
// The first run only marks existing jobs, so nobody is sent the whole catalogue.
import { writeFileSync } from "node:fs";
import { renderDigest } from "./email-template.mjs";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.techgulf-jobs.com").replace(/\/$/, "");
const MAX_JOBS = 5;
// Levels that fit each experience option on the profile form.
const LEVELS_FOR_YEARS = { "0-1": ["intern", "junior"], "1-3": ["junior", "mid"], "3-5": ["mid", "senior"], "5-8": ["mid", "senior", "lead"], "8+": ["senior", "lead"] };
const COUNTRY_NAME = { AE: "UAE", SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait", OM: "Oman", BH: "Bahrain", IN: "India", REMOTE: "Remote" };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const previewPath = args.find((a) => a.startsWith("--preview="))?.split("=")[1];
let mailer;
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

// A personal Gmail account allows about 500 recipients a day.
/** Used when nothing matches: the newest jobs, with the person's countries first. */
export function newestJobs(jobs, profile) {
  const targets = new Set(profile.targets ?? []);
  return jobs
    .map((j) => ({ ...j, matched: [], countryName: j.country === "REMOTE" ? "" : COUNTRY_NAME[j.country] }))
    .sort((a, b) => Number(targets.has(b.country)) - Number(targets.has(a.country)) || b.postedAt.localeCompare(a.postedAt));
}

async function send({ to, subject, html, text, settingsUrl }) {
  const { createTransport } = await import("nodemailer");
  mailer ??= createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  await mailer.sendMail({ from: `TechGulf Jobs <${process.env.GMAIL_USER}>`, to, subject, html, text, headers: { "List-Unsubscribe": `<${settingsUrl}>` } });
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

if (!dryRun && (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)) {
  throw new Error("Add GMAIL_USER and GMAIL_APP_PASSWORD to .env, or use --dry-run.");
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

// Not yet emailed, or posted today (UTC). digestRuns stops anyone getting two emails in a day.
const newJobs = jobSnap.docs
  .filter((d) => !d.get("notifiedAt") || String(d.get("postedAt")).startsWith(today))
  .map((d) => ({ ...d.data(), id: d.id }));
console.log(`${newJobs.length} jobs to send (new or posted today)`);
if (!newJobs.length) process.exit(0);

const userSnap = await db.collection("users").get();
const recipients = userSnap.docs.filter((d) => d.get("profile") && d.get("profile.emailDigest") !== false);
// Records who was emailed today, so running twice in a day cannot send twice.
const runRef = db.collection("digestRuns").doc(today);
const alreadySent = new Set((await runRef.get()).data()?.sent ?? []);

let sent = 0, skipped = 0, failed = 0;
for (const user of recipients) {
  const { email, profile } = user.data();
  const matches = jobsForUser(newJobs, profile);
  const personal = matches.length > 0;
  const picks = (personal ? matches : newestJobs(newJobs, profile)).slice(0, MAX_JOBS);
  if (!email || alreadySent.has(user.id)) { skipped++; continue; }
  const message = renderDigest({ name: profile.name, jobs: picks, total: picks.length, personal, siteUrl: SITE_URL });
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

console.log(`${dryRun ? "Would send" : "Sent"} ${sent}, skipped ${skipped}, failed ${failed}, of ${recipients.length} users`);
// After a failure jobs stay new, so a rerun retries; people already emailed today are skipped.
if (failed) process.exitCode = 1;
else if (!dryRun) await markNotified(pending);
