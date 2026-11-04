"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { actions, useStore, type CertificationEntry, type EducationEntry, type LanguageEntry, type WorkEntry } from "@/lib/store";
import type { Dict, Locale } from "@/lib/i18n";
import { COUNTRY_CODES } from "@/lib/format";
import { SAMPLE_PROFILE } from "@/lib/sample-profile";
import { CvEntries } from "./cv-fields";
import { Select } from "./select";
import { SkillPicker } from "./skill-picker";
import { CheckIcon } from "./icons";

const field = "h-11 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";

const subscribeNever = () => () => {};

/** Saved data only exists in the browser, so the form must first render there to start with it filled in. */
export function Onboarding(props: { d: Dict; lang: Locale; skills: string[] }) {
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);
  return inBrowser ? <ProfileForm {...props} /> : null;
}

function ProfileForm({ d, lang, skills }: { d: Dict; lang: Locale; skills: string[] }) {
  const t = d.onboard;
  const router = useRouter();
  const { user, profile } = useStore();
  const [form, setForm] = useState(() => ({
    name: profile?.name ?? user?.name ?? "", title: profile?.title ?? "", years: profile?.years ?? "",
    location: profile?.location ?? "IN", targets: profile?.targets ?? ["AE"], needVisa: profile?.needVisa ?? true,
    whatsapp: profile?.whatsapp ?? "", skills: profile?.skills ?? [],
    summary: profile?.summary ?? "", linkedin: profile?.linkedin ?? "", portfolio: profile?.portfolio ?? "",
    work: profile?.work ?? [], education: profile?.education ?? [], languages: profile?.languages ?? [], certifications: profile?.certifications ?? [],
  }));
  const [incomplete, setIncomplete] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeleteFailed, setAccountDeleteFailed] = useState(false);
  const accountDeleted = useRef(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  // Signed-out users go to sign in first
  useEffect(() => { if (!user && !accountDeleted.current) router.replace(`/${lang}/login?next=/${lang}/onboarding`); }, [user, lang, router]);
  if (!user) return null;
  // Name comes from Google until the user edits it
  const name = form.name || user.name;

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // New graduates may have no jobs yet, so either history is enough
    if (!form.years || !form.targets.length || !form.skills.length || !(form.work.length || form.education.length)) return setIncomplete(true);
    setIncomplete(false);
    actions.saveProfile({ ...form, name });
    const raw = new URLSearchParams(location.search).get("next");
    // Coming back to this page after saving would look like nothing happened
    const safe = raw && /^\/(?![/\\])/.test(raw) && raw.split("?")[0] !== `/${lang}/onboarding`;
    router.push(safe ? raw : `/${lang}/jobs`);
  };

  const label = (text: string, extra?: string) => (
    <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium">{text}{extra && <span className="text-xs font-normal text-muted">{extra}</span>}</span>
  );

  return (
    <div className="space-y-6">
    <form onSubmit={submit} className="space-y-6">
      {process.env.NODE_ENV === "development" && (
        <button type="button" onClick={() => set(SAMPLE_PROFILE)} className="h-11 w-full rounded-lg border border-dashed border-primary text-sm font-semibold text-primary">Fill sample data (dev only)</button>
      )}
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
          <SkillPicker suggestions={skills} selected={form.skills} onAdd={(skill) => set({ skills: [...form.skills, skill] })} placeholder="React, AWS…" addLabel={t.addSkill} inputClassName={field} />
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

      {/* About */}
      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <h2 className="font-semibold">{t.aboutTitle}</h2>
        <label className="mt-4 block">{label(t.summary)}
          <textarea required rows={4} value={form.summary} onChange={(e) => set({ summary: e.target.value })} placeholder={t.summaryHint} className={`${field} h-auto py-2`} />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">{label("LinkedIn", t.optional)}
            <input type="url" dir="ltr" value={form.linkedin} onChange={(e) => set({ linkedin: e.target.value })} placeholder="https://linkedin.com/in/…" className={field} />
          </label>
          <label className="block">{label(t.portfolio, t.optional)}
            <input type="url" dir="ltr" value={form.portfolio} onChange={(e) => set({ portfolio: e.target.value })} placeholder="https://github.com/…" className={field} />
          </label>
        </div>
      </section>

      <CvEntries<WorkEntry> title={t.workHistory} sub={t.historyHint} entries={form.work} onChange={(work) => set({ work })} addLabel={t.addWork} removeLabel={t.removeEntry} inputClassName={field}
        blank={{ title: "", company: "", start: "", end: "", description: "" }}
        fields={[
          { key: "title", label: t.roleTitle, required: true },
          { key: "company", label: t.company, required: true },
          { key: "start", label: t.startDate, placeholder: "03/2021", required: true, ltr: true },
          { key: "end", label: t.endDate, placeholder: t.endHint, required: true },
          { key: "description", label: t.workDescription, placeholder: t.workDescriptionHint, multiline: true },
        ]} />

      <CvEntries<EducationEntry> title={t.educationTitle} entries={form.education} onChange={(education) => set({ education })} addLabel={t.addEducation} removeLabel={t.removeEntry} inputClassName={field}
        blank={{ school: "", degree: "", start: "", end: "" }}
        fields={[
          { key: "school", label: t.school, required: true },
          { key: "degree", label: t.degree, required: true },
          { key: "start", label: t.startYear, placeholder: "2016", ltr: true },
          { key: "end", label: t.endYear, placeholder: "2020", ltr: true },
        ]} />

      <CvEntries<LanguageEntry> title={t.languagesTitle} entries={form.languages} onChange={(languages) => set({ languages })} addLabel={t.addLanguage} removeLabel={t.removeEntry} inputClassName={field}
        blank={{ name: "", level: "" }}
        fields={[
          { key: "name", label: t.languageName, placeholder: "English", required: true },
          { key: "level", label: t.languageLevel, placeholder: t.languageLevelHint },
        ]} />

      <CvEntries<CertificationEntry> title={t.certificationsTitle} entries={form.certifications} onChange={(certifications) => set({ certifications })} addLabel={t.addCertification} removeLabel={t.removeEntry} inputClassName={field}
        blank={{ name: "", issuer: "", year: "" }}
        fields={[
          { key: "name", label: t.certificationName, placeholder: "AWS Solutions Architect", required: true },
          { key: "issuer", label: t.certificationIssuer, placeholder: "Amazon" },
          { key: "year", label: t.certificationYear, placeholder: "2024", ltr: true },
        ]} />

      {incomplete && <p role="alert" className="text-sm text-danger">{t.missingFields}</p>}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t.privacy}</p>
        <button className="h-12 shrink-0 rounded-lg bg-primary px-8 font-semibold text-on-primary transition hover:opacity-90">{profile ? t.save : t.finish}</button>
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
