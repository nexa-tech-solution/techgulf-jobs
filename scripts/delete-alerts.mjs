// One-off: removes all saved job alerts from Firestore (the feature was retired).
//   node --env-file-if-exists=.env scripts/delete-alerts.mjs            count only, writes nothing
//   node --env-file-if-exists=.env scripts/delete-alerts.mjs --delete   delete them
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: "techgulf-jobs" }));
const snap = await db.collectionGroup("alerts").get();
// Only users/{uid}/alerts belongs to the retired feature.
const docs = snap.docs.filter((d) => /^users\/[^/]+\/alerts\/[^/]+$/.test(d.ref.path));
const users = new Set(docs.map((d) => d.ref.parent.parent.id));
console.log(`Found ${docs.length} alerts from ${users.size} users (${snap.size - docs.length} documents elsewhere ignored)`);

if (process.argv.includes("--delete")) {
  const writer = db.bulkWriter();
  for (const d of docs) writer.delete(d.ref);
  await writer.close();
  const left = (await db.collectionGroup("alerts").get()).docs.filter((d) => d.ref.path.startsWith("users/")).length;
  console.log(`Deleted ${docs.length}. Remaining: ${left}`);
}
