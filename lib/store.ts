"use client";
import { useSyncExternalStore } from "react";

export type AppStatus = "saved" | "applied" | "interview" | "offer" | "rejected";
export interface Alert { id: string; q: string; country: string; category: string; channel: string; frequency: string }

type State = { jobs: Record<string, AppStatus>; alerts: Alert[] };
const KEY = "tgj:v1";
const EMPTY: State = { jobs: {}, alerts: [] };
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

export const actions = {
  toggleSave(id: string) {
    const jobs = { ...state.jobs };
    if (jobs[id]) delete jobs[id]; else jobs[id] = "saved";
    set({ ...state, jobs });
  },
  setStatus(id: string, s: AppStatus) { set({ ...state, jobs: { ...state.jobs, [id]: s } }); },
  addAlert(a: Omit<Alert, "id">) { set({ ...state, alerts: [...state.alerts, { ...a, id: crypto.randomUUID() }] }); },
  removeAlert(id: string) { set({ ...state, alerts: state.alerts.filter((a) => a.id !== id) }); },
};
