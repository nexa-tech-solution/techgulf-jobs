import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import type { User } from "@/lib/store";

const auth = getAuth(app);

const toUser = (u: FirebaseUser): User => {
  const email = u.email ?? "";
  return { uid: u.uid, name: u.displayName ?? email, email, provider: "google", avatarColor: "#0f766e" };
};

export async function signInWithGoogle(): Promise<User> {
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
  return toUser(user);
}

export const signOutOfGoogle = () => signOut(auth);

/** Reports the restored session on load, then every later change. Returns an unsubscribe function. */
export const watchAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, (u) => callback(u && toUser(u)));
