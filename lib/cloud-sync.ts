import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { actions, getStoreState, subscribeStore, type AppStatus, type Profile, type State } from "@/lib/store";

const db = getFirestore(app);

// Firestore rejects undefined values, which optional fields can contain
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const report = (error: unknown) => console.warn("Cloud sync write failed", error);

/** Merges this browser's data into the account: the account wins, and local-only items are uploaded. */
async function hydrate(uid: string) {
  const [userSnap, savedSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDocs(collection(db, "users", uid, "savedJobs")),
  ]);
  const local = getStoreState();
  const cloudJobs = Object.fromEntries(savedSnap.docs.map((d) => [d.id, d.data().status as AppStatus]));
  const cloudProfile = userSnap.data()?.profile as Profile | undefined;

  const newJobs = Object.entries(local.jobs).filter(([id]) => !cloudJobs[id]);
  const profile = cloudProfile ?? local.profile;

  const batch = writeBatch(db);
  const now = serverTimestamp();
  newJobs.forEach(([id, status]) => batch.set(doc(db, "users", uid, "savedJobs", id), { status, savedAt: now, updatedAt: now }));
  if (!cloudProfile && profile) batch.set(doc(db, "users", uid), { email: local.user?.email ?? "", profile: clean(profile), updatedAt: now }, { merge: true });
  await batch.commit();

  actions.hydrate({
    jobs: { ...cloudJobs, ...Object.fromEntries(newJobs) },
    // Alerts were retired: this also clears any still saved in this browser.
    alerts: [],
    profile,
  });
}

/** Writes only what changed between two store states. */
function pushChanges(uid: string, prev: State, next: State) {
  const now = serverTimestamp();
  for (const [id, status] of Object.entries(next.jobs)) {
    if (prev.jobs[id] === status) continue;
    const times = prev.jobs[id] ? { updatedAt: now } : { savedAt: now, updatedAt: now };
    setDoc(doc(db, "users", uid, "savedJobs", id), { status, ...times }, { merge: true }).catch(report);
  }
  for (const id of Object.keys(prev.jobs)) {
    if (!next.jobs[id]) deleteDoc(doc(db, "users", uid, "savedJobs", id)).catch(report);
  }
  if (next.profile && next.profile !== prev.profile) {
    setDoc(doc(db, "users", uid), { email: next.user?.email ?? "", profile: clean(next.profile), updatedAt: now }, { merge: true }).catch(report);
  }
}

let current: { uid: string; ready: Promise<void>; stop: () => void } | null = null;

export function stopCloudSync() {
  current?.stop();
  current = null;
}

/** Loads the account into the store, then mirrors later changes. Safe to call repeatedly for the same user. */
export function startCloudSync(uid: string): Promise<void> {
  if (current?.uid === uid) return current.ready;
  stopCloudSync();
  let unsubscribe = () => {};
  let stopped = false;
  const ready = hydrate(uid).then(() => {
    if (stopped) return;
    let prev = getStoreState();
    unsubscribe = subscribeStore(() => {
      const next = getStoreState();
      // Clearing the store at sign-out must never delete the account's data
      if (next.user?.uid !== uid) return;
      pushChanges(uid, prev, next);
      prev = next;
    });
  });
  current = { uid, ready, stop: () => { stopped = true; unsubscribe(); } };
  return ready;
}
