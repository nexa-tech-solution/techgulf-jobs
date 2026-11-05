import { escapeTex as e, type CvTemplate } from "@/lib/cv-latex";
import type { Dict, Locale } from "@/lib/i18n";
import { cvSample } from "@/lib/cv-samples";
import type { Profile } from "@/lib/store";

/** Made-up person for the Arabic starting document. */
const SAMPLE_PROFILE_AR: Profile = {
  name: "سارة حداد", title: "مهندسة برمجيات أولى", years: "5-8", location: "AE", targets: [], needVisa: false,
  whatsapp: "+971 50 000 0000", skills: ["Go", "PostgreSQL", "Kafka", "AWS", "Kubernetes"],
  summary: "مهندسة برمجيات بخبرة 6 سنوات في بناء منصات الدفع والتوصيل في الخليج.",
  portfolio: "https://github.com/example-sara-haddad",
  work: [
    { title: "مهندسة برمجيات أولى", company: "شركة مثال للمدفوعات", start: "03/2022", end: "حتى الآن", description: "أقود فريقاً من 4 مهندسين لبناء واجهات الدفع.\nخفضت أخطاء إتمام الشراء بنسبة 30%." },
    { title: "مهندسة برمجيات", company: "شركة مثال للتوصيل", start: "06/2019", end: "02/2022", description: "بنيت خدمات تتبع الطلبات باستخدام Kafka وPostgreSQL." },
  ],
  education: [{ school: "جامعة مثال", degree: "بكالوريوس علوم الحاسب", start: "2015", end: "2019" }],
  languages: [{ name: "العربية", level: "اللغة الأم" }, { name: "الإنجليزية", level: "بطلاقة" }],
  certifications: [{ name: "AWS Solutions Architect", issuer: "Amazon", year: "2023" }],
};

/** The starting document for someone with no profile: a sample written for that template. */
export function sampleSource(template: CvTemplate, lang: Locale, d: Dict): string {
  if (lang === "ar" && template !== "bilingual") return profileToSource(SAMPLE_PROFILE_AR, template, lang, d, "name@example.com");
  return cvSample(template);
}

const BILINGUAL = { summary: "Summary | نبذة", experience: "Experience | الخبرة", education: "Education | التعليم", skills: "Skills | المهارات", languages: "Languages | اللغات", certifications: "Certifications | الشهادات" };

/** Writes a complete CV source from a profile, in the section order suited to the template. Work descriptions become one bullet per line. */
export function profileToSource(profile: Profile, template: CvTemplate, lang: Locale, d: Dict, email?: string): string {
  const t = template === "bilingual" ? { ...d.cvEditor.sections, ...BILINGUAL } : d.cvEditor.sections;
  const country = (d.country as Record<string, string>)[profile.location] ?? profile.location;
  const out: string[] = [
    `\\documentclass${lang === "ar" ? "[rtl]" : ""}{${template}}`,
    "\\accentcolor{0f766e}",
    "",
    `\\name{${e(profile.name)}}`,
    `\\headline{${e(profile.title)}}`,
  ];
  if (email) out.push(`\\email{${e(email)}}`);
  if (profile.whatsapp) out.push(`\\phone{${e(profile.whatsapp)}}`);
  if (country) out.push(`\\location{${e(country)}}`);
  for (const link of [profile.linkedin, profile.portfolio]) if (link) out.push(`\\website{${e(link)}}`);
  if (template === "gulf" || template === "bilingual") {
    const p = d.cvEditor.sections.personal;
    // The profile doesn't record nationality, so it is left for the person to fill in rather than guessed.
    out.push(`% \\personal{${p.nationality}}{...}`, `\\personal{${p.visa}}{${profile.needVisa ? p.needsVisa : p.noVisa}}`);
  }
  out.push("", "\\begin{document}", "");

  const summary = () => { if (profile.summary) out.push(`\\section{${t.summary}}`, e(profile.summary), ""); };
  const work = () => {
    if (!profile.work?.length) return;
    out.push(`\\section{${t.experience}}`);
    for (const job of profile.work) {
      out.push(`\\entry{${e(job.title)}}{${e(job.company)}}{${dates(job.start, job.end)}}{}`);
      const bullets = job.description.split("\n").map((line) => line.trim()).filter(Boolean);
      if (bullets.length) out.push("\\begin{itemize}", ...bullets.map((b) => `  \\item ${e(b)}`), "\\end{itemize}");
    }
    out.push("");
  };
  const education = () => {
    if (!profile.education?.length) return;
    out.push(`\\section{${t.education}}`);
    for (const edu of profile.education) out.push(`\\entry{${e(edu.degree)}}{${e(edu.school)}}{${dates(edu.start, edu.end)}}{}`);
    out.push("");
  };
  const skills = () => { if (profile.skills.length) out.push(`\\section{${t.skills}}`, profile.skills.map(e).join(", "), ""); };
  const languages = () => { if (profile.languages?.length) out.push(`\\section{${t.languages}}`, profile.languages.map((l) => (l.level ? `${e(l.name)} (${e(l.level)})` : e(l.name))).join(", "), ""); };
  const certifications = () => {
    if (!profile.certifications?.length) return;
    out.push(`\\section{${t.certifications}}`);
    for (const c of profile.certifications) out.push(`\\entry{${e(c.name)}}{${e(c.issuer)}}{${e(c.year)}}{}`);
    out.push("");
  };

  if (template === "sidebar") {
    summary(); work(); education();
    out.push("\\begin{sidebar}");
    skills(); languages(); certifications();
    out.push("\\end{sidebar}", "");
  } else {
    const order = template === "fresher" ? [summary, education, skills, work, certifications, languages]
      : template === "engineer" ? [summary, skills, work, education, certifications, languages]
      : [summary, work, education, skills, languages, certifications];
    order.forEach((section) => section());
  }
  out.push("\\end{document}", "");
  return out.join("\n");
}

const dates = (start: string, end: string) => [start, end].filter(Boolean).map(e).join(" -- ");
