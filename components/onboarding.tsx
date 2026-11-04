"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { actions, useStore } from "@/lib/store";
import type { Dict, Locale } from "@/lib/i18n";
import { COUNTRY_CODES } from "@/lib/format";
import { JOBS } from "@/lib/mock-data";
import { Select } from "./select";
import { SkillPicker } from "./skill-picker";
import { CheckIcon, UploadIcon } from "./icons";

const field = "h-11 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";

// Employer keywords, so typed skills use the same spelling that job matching compares against
const KNOWN_SKILLS = [...new Set(JOBS.flatMap((job) => job.tags))].sort((a, b) => a.localeCompare(b));
const UPLOAD_MIN_MS = 1200;

export function Onboarding({ d, lang }: { d: Dict; lang: Locale }) {
  const t = d.onboard;
  const router = useRouter();
  const { user, profile } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => ({
    name: profile?.name ?? user?.name ?? "", title: profile?.title ?? "", years: profile?.years ?? "",
    location: profile?.location ?? "IN", targets: profile?.targets ?? ["AE"], needVisa: profile?.needVisa ?? true,
    whatsapp: profile?.whatsapp ?? "", cvName: profile?.cvName ?? "", cvPath: profile?.cvPath ?? "", cvConsentAt: profile?.cvConsentAt ?? "", skills: profile?.skills ?? [],
  }));
  const [parsing, setParsing] = useState(false);
  const [drag, setDrag] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [consented, setConsented] = useState(false);
  const [consentMissing, setConsentMissing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeleteFailed, setAccountDeleteFailed] = useState(false);
  const accountDeleted = useRef(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  // Signed-out users go to sign in first
  useEffect(() => { if (!user && !accountDeleted.current) router.replace(`/${lang}/login?next=/${lang}/onboarding`); }, [user, lang, router]);
  if (!user) return null;
  // Name comes from Google until the user edits it
  const name = form.name || user.name;

  const upload = async (f?: File) => {
    if (!f) return;
    if (!consented) return setConsentMissing(true);
    const previous = form.cvName;
    setParsing(true);
    setUploadFailed(false);
    set({ cvName: f.name });
    try {
      const { uploadCv } = await import("@/lib/cv");
      // Short minimum so the progress state doesn't flash
      const [cv] = await Promise.all([uploadCv(user.uid, f), new Promise((done) => setTimeout(done, UPLOAD_MIN_MS))]);
      set(cv);
      actions.setCv(cv);
    } catch (error) {
      console.error("CV upload failed", error);
      set({ cvName: previous });
      setParsing(false);
      setUploadFailed(true);
      return;
    }
    setParsing(false);
  };

  const removeAccount = async () => {
    setDeletingAccount(true);
    setAccountDeleteFailed(false);
    try {
      const { deleteAccount } = await import("@/lib/delete-account");
      await deleteAccount();
      accountDeleted.current = true;
      actions.signOut();
      router.replace(`/${lang}`);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/popup-closed-by-user") {
        console.error("Account delete failed", error);
        setAccountDeleteFailed(true);
      }
      setDeletingAccount(false);
    }
  };

  const removeCv = async () => {
    if (!window.confirm(t.deleteCvConfirm)) return;
    setUploadFailed(false);
    setDeleteFailed(false);
    try {
      const [{ deleteCv }, { clearCvRecord }] = await Promise.all([import("@/lib/cv"), import("@/lib/cloud-sync")]);
      await deleteCv(user.uid);
      await clearCvRecord(user.uid);
      actions.clearCv();
      set({ cvName: "", cvPath: "", cvConsentAt: "" });
    } catch (error) {
      console.error("CV delete failed", error);
      setDeleteFailed(true);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsing) return;
    if (!form.years || !form.targets.length || !form.skills.length) return setIncomplete(true);
    actions.saveProfile({ ...form, name });
    const raw = new URLSearchParams(location.search).get("next");
    router.push(raw && /^\/(?![/\\])/.test(raw) ? raw : `/${lang}/jobs`);
  };

  const label = (text: string, extra?: string) => (
    <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium">{text}{extra && <span className="text-xs font-normal text-muted">{extra}</span>}</span>
  );

  return (
    <div className="space-y-6">
    <form onSubmit={submit} className="space-y-6">
      {/* Account from Google */}
      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white" style={{ background: user.avatarColor }}>
            {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-muted"><CheckIcon className="h-3.5 w-3.5 text-success" />{t.fromGoogle}</p>
            <p className="truncate font-semibold" dir="ltr">{user.email}</p>
          </div>
        </div>
        <label className="mt-5 block">{label(t.fullName)}<input required value={name} onChange={(e) => set({ name: e.target.value })} className={field} /></label>
      </section>

      {/* CV */}
      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <h2 className="font-semibold">{t.cvTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.cvSub}</p>
        {form.cvName ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-danger/10 text-[11px] font-bold text-danger">PDF</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" dir="ltr">{form.cvName}</p>
              <p className="text-xs text-muted">{parsing ? t.reading : t.cvReady}</p>
            </div>
            {parsing ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label={t.reading} />
              : <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-medium text-primary hover:underline">{t.replace}</button>}
            {!parsing && <button type="button" onClick={removeCv} className="text-sm font-medium text-danger hover:underline">{t.deleteCv}</button>}
          </div>
        ) : (
          <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
            className={`mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? "border-primary bg-primary/5" : "border-line hover:border-ink/30"}`}>
            <UploadIcon className="h-7 w-7 text-primary" />
            <p className="mt-2 font-medium">{t.drop}</p>
            <p className="text-xs text-muted">PDF, DOCX · max 5 MB</p>
          </div>
        )}
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" checked={consented} onChange={(e) => { setConsented(e.target.checked); setConsentMissing(false); }} className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]" />
          <span>{t.cvConsent} <Link href={`/${lang}/privacy`} target="_blank" className="text-primary hover:underline">{t.privacyLink}</Link></span>
        </label>
        {consentMissing && <p role="alert" className="mt-2 text-sm text-danger">{t.cvConsentRequired}</p>}
        {uploadFailed && <p role="alert" className="mt-3 text-sm text-danger">{t.uploadError}</p>}
        {deleteFailed && <p role="alert" className="mt-3 text-sm text-danger">{t.deleteCvError}</p>}
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      </section>

      {/* Work */}
      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <h2 className="font-semibold">{t.workTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">{label(t.jobTitle)}
            <input required value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Senior Backend Engineer" className={field} />
          </label>
          <div>{label(t.experience)}
            <Select name="years" value={form.years} onChange={(v) => set({ years: v })} placeholder={t.choose}
              options={[["0-1", "0–1"], ["1-3", "1–3"], ["3-5", "3–5"], ["5-8", "5–8"], ["8+", "8+"]].map(([v, l]) => ({ value: v, label: `${l} ${t.yrs}` }))} />
          </div>
          <div>{label(t.livesIn)}
            <Select name="location" value={form.location} onChange={(v) => set({ location: v })} placeholder={t.choose}
              options={COUNTRY_CODES.filter((c) => c !== "REMOTE").map((c) => ({ value: c, label: d.country[c] }))} />
          </div>
        </div>

        <div className="mt-5">{label(t.skills)}
          <SkillPicker suggestions={KNOWN_SKILLS} selected={form.skills} onAdd={(skill) => set({ skills: [...form.skills, skill] })} placeholder="React, AWS…" addLabel={t.addSkill} inputClassName={field} />
          {form.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
              {form.skills.map((s) => (
                <button key={s} type="button" onClick={() => set({ skills: form.skills.filter((x) => x !== s) })} title={t.removeSkill}
                  className="inline-flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2 font-mono text-[12px] text-primary hover:bg-danger/10 hover:text-danger">{s} <span aria-hidden>×</span></button>
              ))}
            </div>
          )}
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">{t.openTo}</legend>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_CODES.map((c) => {
              const on = form.targets.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} onClick={() => set({ targets: on ? form.targets.filter((x) => x !== c) : [...form.targets, c] })}
                  className={`h-9 rounded-full border px-3.5 text-sm font-medium transition ${on ? "border-ink bg-ink text-surface" : "border-line hover:border-ink/40"}`}>{d.country[c]}</button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-5 flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-4">
          <span><span className="block text-sm font-medium">{t.needVisa}</span><span className="text-xs text-muted">{t.needVisaSub}</span></span>
          <input type="checkbox" checked={form.needVisa} onChange={(e) => set({ needVisa: e.target.checked })} className="peer sr-only" />
          <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 after:absolute after:start-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" aria-hidden />
        </label>

        <label className="mt-5 block">{label(t.whatsapp, t.optional)}
          <input type="tel" dir="ltr" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+91 98765 43210" className={field} />
          <span className="mt-1.5 block text-xs text-muted">{t.whatsappSub}</span>
        </label>
      </section>

      {incomplete && <p role="alert" className="text-sm text-danger">{t.missingFields}</p>}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t.privacy}</p>
        <button disabled={parsing} className="h-12 shrink-0 rounded-lg bg-primary px-8 font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">{profile ? t.save : t.finish}</button>
      </div>
    </form>
    <section className="rounded-2xl border border-danger/30 bg-surface p-5 md:p-6">
      <h2 className="font-semibold">{t.deleteAccount}</h2>
      <p className="mt-1 text-sm text-muted">{t.deleteAccountSub}</p>
      {accountDeleteFailed && <p role="alert" className="mt-3 text-sm text-danger">{t.deleteAccountError}</p>}
      {confirmingDelete ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={removeAccount} disabled={deletingAccount} className="h-11 rounded-lg bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60">{t.deleteAccountConfirm}</button>
          <button type="button" onClick={() => setConfirmingDelete(false)} disabled={deletingAccount} className="h-11 rounded-lg border border-line px-4 text-sm font-semibold">{t.keepAccount}</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmingDelete(true)} className="mt-4 h-11 rounded-lg border border-danger/40 px-4 text-sm font-semibold text-danger hover:bg-danger/10">{t.deleteAccount}</button>
      )}
    </section>
    </div>
  );
}
