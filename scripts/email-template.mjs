// The project's email template. Email clients ignore stylesheets, so it uses tables and inline styles.
// Urgency here must stay true: it comes from each job's real posting date and the fact that closed roles are removed. No invented deadlines.
import { SOCIAL_LINKS } from "../lib/social.mjs";

const BRAND = { primary: "#0f766e", ink: "#0f172a", muted: "#64748b", line: "#e2e8f0", page: "#f1f5f9", amber: "#fbbf24", mint: "#5eead4" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const DAY_MS = 86_400_000;
const FRESH_DAYS = 7; // Older postings show no age: it would work against the message.

export const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const place = (job) => [job.city, job.countryName].filter(Boolean).join(", ") || "Remote";
const jobUrl = (job, siteUrl) => `${siteUrl}/en/jobs/${encodeURIComponent(job.id)}`;

/** Whole UTC days since posting, or null when the date is missing or invalid. */
function ageInDays(postedAt) {
  const posted = Date.parse(postedAt);
  if (Number.isNaN(posted)) return null;
  const utcDay = (ms) => Math.floor(ms / DAY_MS);
  return Math.max(0, utcDay(Date.now()) - utcDay(posted));
}

function ageBadge(age) {
  if (age === null || age > FRESH_DAYS) return "";
  const hot = age === 0;
  const label = hot ? "Posted today" : age === 1 ? "Posted yesterday" : `Posted ${age} days ago`;
  return `<span style="display:inline-block;margin-bottom:8px;padding:3px 9px;border-radius:999px;background:${hot ? "#fee2e2" : "#fef3c7"};font-size:12px;line-height:16px;font-weight:700;color:${hot ? "#b91c1c" : "#92400e"};">${label}</span><br>`;
}

function jobRow(job, siteUrl) {
  const url = escapeHtml(jobUrl(job, siteUrl));
  const chips = (job.matched ?? []).map((skill) =>
    `<span style="display:inline-block;margin:0 4px 4px 0;padding:2px 8px;border-radius:6px;background:#ccfbf1;font-size:12px;line-height:18px;font-weight:600;color:#115e59;">${escapeHtml(skill)}</span>`).join("");
  return `<tr><td style="padding:0 0 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:10px;"><tr><td style="padding:18px 20px;font-family:${FONT};">
      ${ageBadge(ageInDays(job.postedAt))}
      <a href="${url}" style="display:block;font-size:17px;line-height:24px;font-weight:700;color:${BRAND.ink};text-decoration:none;">${escapeHtml(job.title)}</a>
      <p style="margin:4px 0 10px;font-size:14px;line-height:20px;color:${BRAND.muted};">${escapeHtml(job.company)} &nbsp;·&nbsp; ${escapeHtml(place(job))}</p>
      ${chips ? `<div style="margin-bottom:8px;">${chips}</div>` : ""}
      <a href="${url}" style="font-size:14px;line-height:20px;font-weight:700;color:${BRAND.primary};text-decoration:none;">View and apply &rarr;</a>
    </td></tr></table>
  </td></tr>`;
}

function socialLinks() {
  return SOCIAL_LINKS.map(({ label, url }) =>
    `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 3px 6px;padding:7px 14px;border:1px solid #cbd5e1;border-radius:999px;background:#ffffff;font-size:13px;line-height:18px;font-weight:600;color:${BRAND.ink};text-decoration:none;">${escapeHtml(label)}</a>`).join("");
}

/** @returns {{ subject: string, html: string, text: string }} */
export function renderDigest({ name, jobs, total, siteUrl, personal = true }) {
  const first = String(name ?? "").trim().split(/\s+/)[0];
  const count = total === 1 ? "1 new IT job" : `${total} new IT jobs`;
  const subject = `Apply early: ${count} ${personal ? "matching your profile" : "on TechGulf Jobs"}`;
  const browse = `${siteUrl}/en/jobs?sort=date`;
  const settings = `${siteUrl}/en/onboarding#email-digest`;
  const more = total - jobs.length;
  const postedToday = jobs.filter((j) => ageInDays(j.postedAt) === 0).length;
  const alert = postedToday ? `${postedToday} posted today` : "Fresh roles";
  const greeting = first ? `Hi ${escapeHtml(first)}, these` : "These";
  const intro = personal ? "roles fit your profile." : "are the latest roles on TechGulf Jobs.";
  const closing = "Employers can close a posting at any time, and it leaves our site once they do.";
  const cta = more > 0 ? `See ${more} more` : "Browse all new jobs";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<div style="display:none;max-height:0;overflow:hidden;">Apply early: ${escapeHtml(jobs[0]?.title ?? "")} at ${escapeHtml(jobs[0]?.company ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:16px 24px;background:${BRAND.ink};border-radius:12px 12px 0 0;font-family:${FONT};font-size:17px;font-weight:700;color:#ffffff;">techgulf<span style="color:${BRAND.mint};">.</span>jobs</td></tr>
    <tr><td style="padding:9px 24px;background:${BRAND.amber};font-family:${FONT};font-size:13px;line-height:18px;font-weight:700;color:${BRAND.ink};">&#9200; DON'T WAIT &nbsp;·&nbsp; ${escapeHtml(alert)}</td></tr>
    <tr><td style="padding:26px 24px 22px;background:#ffffff;border-radius:0 0 12px 12px;font-family:${FONT};">
      <h1 style="margin:0;font-size:28px;line-height:34px;font-weight:800;letter-spacing:-0.4px;color:${BRAND.ink};">${escapeHtml(count)}${personal ? " for you" : ""}. Be an early applicant.</h1>
      <p style="margin:10px 0 0;font-size:15px;line-height:22px;color:#475569;">${greeting} ${intro} ${closing}</p>
    </td></tr>
    <tr><td style="padding-top:12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${jobs.map((j) => jobRow(j, siteUrl)).join("")}</table></td></tr>
    <tr><td style="padding-top:4px;">
      <a href="${escapeHtml(browse)}" style="display:block;padding:15px 20px;background:${BRAND.primary};border-radius:10px;text-align:center;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${cta} &rarr;</a>
    </td></tr>
    <tr><td align="center" style="padding:28px 8px 0;font-family:${FONT};">
      <p style="margin:0 0 10px;font-size:13px;line-height:18px;font-weight:600;color:${BRAND.ink};">Follow TechGulf Jobs</p>
      ${socialLinks()}
      <p style="margin:14px 0 0;font-size:12px;line-height:18px;color:${BRAND.muted};">You get this email because you have a TechGulf Jobs profile.<br><a href="${escapeHtml(settings)}" style="color:${BRAND.muted};text-decoration:underline;">Turn off these emails</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `${count}${personal ? " for you" : ""}. Be an early applicant.`,
    closing, "",
    ...jobs.flatMap((j) => [`${j.title} - ${j.company}, ${place(j)}`, jobUrl(j, siteUrl), ""]),
    `${cta}: ${browse}`, "",
    "Follow TechGulf Jobs:",
    ...SOCIAL_LINKS.map(({ label, url }) => `${label}: ${url}`), "",
    `Turn off these emails: ${settings}`,
  ].join("\n");

  return { subject, html, text };
}
