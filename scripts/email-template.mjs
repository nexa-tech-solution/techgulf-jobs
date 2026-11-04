// The project's email template. Email clients ignore stylesheets, so it uses tables and inline styles.

const BRAND = { primary: "#0f766e", ink: "#0f172a", muted: "#64748b", line: "#e2e8f0", page: "#f8fafc" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const place = (job) => [job.city, job.countryName].filter(Boolean).join(", ") || "Remote";

function jobRow(job, siteUrl) {
  const url = `${siteUrl}/en/jobs/${encodeURIComponent(job.id)}`;
  const matched = job.matched?.length ? `Matches your skills: ${job.matched.join(", ")}` : "";
  return `<tr><td style="padding:16px 0;border-top:1px solid ${BRAND.line};font-family:${FONT};">
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">${escapeHtml(job.company)} &middot; ${escapeHtml(place(job))}</p>
    <p style="margin:4px 0 0;font-size:16px;line-height:22px;font-weight:600;"><a href="${escapeHtml(url)}" style="color:${BRAND.ink};text-decoration:none;">${escapeHtml(job.title)}</a></p>
    ${matched ? `<p style="margin:6px 0 0;font-size:13px;color:${BRAND.primary};">${escapeHtml(matched)}</p>` : ""}
  </td></tr>`;
}

/** @returns {{ subject: string, html: string, text: string }} */
export function renderDigest({ name, jobs, total, siteUrl }) {
  const first = String(name ?? "").trim().split(/\s+/)[0];
  const count = total === 1 ? "1 new IT job" : `${total} new IT jobs`;
  const subject = `${count} matching your profile`;
  const settings = `${siteUrl}/en/onboarding#email-digest`;
  const browse = `${siteUrl}/en/jobs?sort=date`;
  const more = total - jobs.length;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(jobs[0]?.title ?? "")} at ${escapeHtml(jobs[0]?.company ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 16px;font-family:${FONT};font-size:18px;font-weight:700;color:${BRAND.ink};">techgulf<span style="color:${BRAND.primary};">.</span>jobs</td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;padding:24px;">
      <h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:28px;color:${BRAND.ink};">${escapeHtml(count)} for you</h1>
      <p style="margin:8px 0 20px;font-family:${FONT};font-size:15px;line-height:22px;color:${BRAND.muted};">${first ? `Hi ${escapeHtml(first)}, here` : "Here"} is what was added in the countries you chose.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${jobs.map((j) => jobRow(j, siteUrl)).join("")}</table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background:${BRAND.primary};border-radius:8px;">
        <a href="${escapeHtml(browse)}" style="display:inline-block;padding:12px 20px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${more > 0 ? `See ${more} more` : "Browse all jobs"}</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:16px 4px;font-family:${FONT};font-size:12px;line-height:18px;color:${BRAND.muted};">
      <a href="${escapeHtml(settings)}" style="color:${BRAND.muted};">Turn off these emails</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `${count} for you`, "",
    ...jobs.flatMap((j) => [`${j.title} - ${j.company}, ${place(j)}`, `${siteUrl}/en/jobs/${encodeURIComponent(j.id)}`, ""]),
    more > 0 ? `See ${more} more: ${browse}` : `Browse all jobs: ${browse}`, "",
    `Turn off these emails: ${settings}`,
  ].join("\n");

  return { subject, html, text };
}
