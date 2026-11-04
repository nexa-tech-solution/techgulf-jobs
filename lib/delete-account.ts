import { GoogleAuthProvider, deleteUser, getAuth, reauthenticateWithPopup } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, getFirestore } from "firebase/firestore";
import { deleteCv } from "@/lib/cv";
import { app } from "@/lib/firebase";

/**
 * Permanently removes the signed-in user's data, then the login itself.
 * Firebase requires a recent sign-in, so that is checked before anything is deleted.
 * The login goes last because the data rules need it, which also makes a failed run safe to repeat.
 */
export async function deleteAccount() {
  const user = getAuth(app).currentUser;
  if (!user) throw new Error("Sign-in required");
  await reauthenticateWithPopup(user, new GoogleAuthProvider());

  const db = getFirestore(app);
  const uid = user.uid;
  await deleteCv(uid);
  const [saved, alerts] = await Promise.all([
    getDocs(collection(db, "users", uid, "savedJobs")),
    getDocs(collection(db, "users", uid, "alerts")),
  ]);
  await Promise.all([...saved.docs, ...alerts.docs].map((item) => deleteDoc(item.ref)));
  await deleteDoc(doc(db, "users", uid));
  await deleteUser(user);
}
