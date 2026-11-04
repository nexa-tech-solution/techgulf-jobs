"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteDoc, doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { COUNTRY_PAY, MIN_REPORTS, SALARY_ROLES, isPlausibleSalary } from "@/lib/format";
import type { Dict, Locale } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { City } from "@/lib/types";
import { Select } from "./select";
import { inputCls } from "./ui";

type Status = "idle" | "saving" | "saved" | "deleted" | "invalid" | "error";

export function SalaryReportForm({ d, lang, cities }: { d: Dict; lang: Locale; cities: City[] }) {
  const t = d.contribute;
  const { user } = useStore();
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [amount, setAmount] = useState("");
  const [exists, setExists] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const uid = user?.uid;
  const options = cities.filter((c) => COUNTRY_PAY[c.country]);
  const pay = COUNTRY_PAY[options.find((c) => c.name === city)?.country ?? "AE"];

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(getFirestore(app), "salaryReports", uid)).then((snap) => {
      const r = snap.data();
      if (!r) return;
      setRole(r.role); setCity(r.city); setAmount(String(r.amount)); setExists(true);
    }).catch((error) => console.warn("Could not load salary report", error));
  }, [uid]);

  if (!uid) return (
    <div className="card p-6 text-center">
      <p className="text-muted">{t.signIn}</p>
      <Link href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/salaries/contribute`)}`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">{d.nav.login}</Link>
    </div>
  );

  const ref = doc(getFirestore(app), "salaryReports", uid);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!role || !city || !pay || !isPlausibleSalary(value, pay.currency, pay.period)) return setStatus("invalid");
    setStatus("saving");
    try {
      await setDoc(ref, { role, city, amount: value, updatedAt: serverTimestamp() });
      setExists(true);
      setStatus("saved");
    } catch (error) {
      console.error("Could not save salary report", error);
      setStatus("error");
    }
  };
  const remove = async () => {
    setStatus("saving");
    try {
      await deleteDoc(ref);
      setRole(""); setCity(""); setAmount(""); setExists(false);
      setStatus("deleted");
    } catch (error) {
      console.error("Could not delete salary report", error);
      setStatus("error");
    }
  };
  const message = { saved: t.saved, deleted: t.deleted, invalid: t.invalid, error: t.error }[status as "saved"];

  return (
    <form onSubmit={save} className="card space-y-4 p-5">
      <div className="block"><span className="mb-1.5 block text-sm font-medium">{d.role}</span>
        <Select placeholder={t.chooseRole} value={role} onChange={setRole} options={SALARY_ROLES.map((r) => ({ value: r.role, label: r.role }))} /></div>
      <div className="block"><span className="mb-1.5 block text-sm font-medium">{t.city}</span>
        <Select placeholder={t.chooseCity} value={city} onChange={setCity} options={options.map((c) => ({ value: c.name, label: lang === "ar" ? c.ar : c.name }))} /></div>
      <label className="block"><span className="mb-1.5 block text-sm font-medium">{t.amount} {city && pay && <span className="font-normal text-muted" dir="ltr">({pay.currency} {pay.period === "month" ? d.perMonth : d.perYear})</span>}</span>
        <input required type="number" min="1" inputMode="numeric" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></label>
      <p className="text-sm text-muted">{t.privacy.replace("{n}", String(MIN_REPORTS))}</p>
      {message && <p role="status" className={`text-sm ${status === "saved" || status === "deleted" ? "text-success" : "text-danger"}`}>{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={status === "saving"} className="h-11 flex-1 rounded-lg bg-primary px-5 font-semibold text-on-primary disabled:opacity-60">{exists ? t.update : t.submit}</button>
        {exists && <button type="button" onClick={remove} disabled={status === "saving"} className="h-11 rounded-lg border border-line px-4 text-sm font-medium text-danger disabled:opacity-60">{t.remove}</button>}
      </div>
    </form>
  );
}
