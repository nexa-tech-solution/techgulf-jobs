"use client";
import { useSyncExternalStore } from "react";

export type AppStatus = "saved" | "applied" | "interview" | "offer" | "rejected";
export type Channel = "email" | "whatsapp" | "telegram";
export interface Alert { id: string; key: string; filters: Record<string, string>; channels: Channel[]; frequency: "instant" | "daily" | "weekly"; createdAt: string }
export interface User { uid: string; name: string; email: string; provider: "google"; avatarColor: string }
export type WorkEntry = { title: string; company: string; start: string; end: string; description: string };
export type EducationEntry = { school: string; degree: string; start: string; end: string };
export type LanguageEntry = { name: string; level: string };
export type CertificationEntry = { name: string; issuer: string; year: string };
export interface Profile {
  name: string; title: string; years: string; location: string; targets: string[];
  needVisa: boolean; whatsapp: string; skills: string[];
  // Added after launch of the profile, so older saved profiles may not have them
  summary?: string; linkedin?: string; portfolio?: string; work?: WorkEntry[]; education?: EducationEntry[];
  languages?: LanguageEntry[]; certifications?: CertificationEntry[];
}

/** Stable key for a set of filters (ignores sort). */
export const filterKey = (f: Record<string, string | undefined>) =>
  Object.entries(f).filter(([k, v]) => v && k !== "sort").sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");

export type State = { jobs: Record<string, AppStatus>; alerts: Alert[]; user: User | null; profile: Profile | null };
const KEY = "tgj:v3";
const EMPTY: State = { jobs: {}, alerts: [], user: null, profile: null };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { state = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { /* ignore */ }
}
function set(next: State) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => EMPTY,
  );
}

export const subscribeStore = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const getStoreState = () => { load(); return state; };

export const actions = {
  toggleSave(id: string) {
    const jobs = { ...state.jobs };
    if (jobs[id]) delete jobs[id]; else jobs[id] = "saved";
    set({ ...state, jobs });
  },
  setStatus(id: string, s: AppStatus) { set({ ...state, jobs: { ...state.jobs, [id]: s } }); },
  /** Saving a search = creating an alert. Delivered to the account email by default. */
  saveSearch(filters: Record<string, string>) {
    const key = filterKey(filters);
    if (state.alerts.some((a) => a.key === key)) return;
    const clean = Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && k !== "sort"));
    set({ ...state, alerts: [{ id: crypto.randomUUID(), key, filters: clean, channels: ["email"], frequency: "daily", createdAt: new Date().toISOString() }, ...state.alerts] });
  },
  removeAlertByKey(key: string) { set({ ...state, alerts: state.alerts.filter((a) => a.key !== key) }); },
  updateAlert(id: string, patch: Partial<Pick<Alert, "channels" | "frequency">>) {
    set({ ...state, alerts: state.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  },
  removeAlert(id: string) { set({ ...state, alerts: state.alerts.filter((a) => a.id !== id) }); },
  /** The account keeps this data in Firestore, so the browser holds no copy after sign-out. */
  signOut() { set(EMPTY); },
  hydrate(data: Pick<State, "jobs" | "alerts" | "profile">) { set({ ...state, ...data }); },
  /** Aligns the store with the Firebase session. Keeps an edited name for the same account. */
  syncAuth(user: User | null) {
    load();
    if (!user) {
      if (state.user) actions.signOut();
      return;
    }
    if (state.user?.uid === user.uid) return;
    // A different account must not inherit the previous one's data
    set(state.user ? { ...EMPTY, user } : { ...state, user });
  },
  saveProfile(profile: Profile) { set({ ...state, profile, user: state.user && { ...state.user, name: profile.name } }); },
};
