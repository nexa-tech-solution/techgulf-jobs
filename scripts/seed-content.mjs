// Writes only Blog and Guides to Firestore. Safe to re-run: unlike seed-firestore.mjs it adds no demo jobs or salaries.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npm run seed:content
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { CAREER_GUIDES } from "../lib/career-guides.ts";
import { CAREER_GUIDES_AR, GUIDES_AR, JOURNEY_AR } from "../lib/guides-ar.ts";
import { GUIDES, JOURNEY, POSTS } from "../lib/seed-content.ts";

const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: "techgulf-jobs" }));
const clean = (value) => JSON.parse(JSON.stringify(value)); // Firestore rejects undefined fields

const writer = db.bulkWriter();
for (const p of POSTS) writer.set(db.collection("posts").doc(p.slug), clean(p));
// The cost table is left out: its figures are illustrative, not sourced.
writer.set(db.collection("content").doc("guides"), clean({ career: CAREER_GUIDES, guides: GUIDES, journey: JOURNEY, cost: [] }));
writer.set(db.collection("content").doc("guides_ar"), clean({ career: CAREER_GUIDES_AR, guides: GUIDES_AR, journey: JOURNEY_AR, cost: [] }));
await writer.close();
console.log(`Wrote ${POSTS.length} posts and ${CAREER_GUIDES.length} career guides in English and Arabic`);
