// The project's email template. Email clients ignore stylesheets, so it uses tables and inline styles.

const BRAND = { primary: "#0f766e", ink: "#0f172a", muted: "#64748b", line: "#eef2f6" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const place = (job) => [job.city, job.countryName].filter(Boolean).join(", ") || "Remote";

function jobRow(job, siteUrl) {
  const url = escapeHtml(`${siteUrl}/en/jobs/${encodeURIComponent(job.id)}`);
  const matched = job.matched?.length ? job.matched.join(" · ") : "";
  return `<tr><td style="padding:20px 0;border-bottom:1px solid ${BRAND.line};font-family:${FONT};">
    <a href="${url}" style="display:block;color:${BRAND.ink};text-decoration:none;">
      <span style="display:block;font-size:16px;line-height:23px;font-weight:600;color:${BRAND.ink};">${escapeHtml(job.title)}</span>
      <span style="display:block;margin-top:4px;font-size:14px;line-height:20px;color:${BRAND.muted};">${escapeHtml(job.company)} &nbsp;·&nbsp; ${escapeHtml(place(job))}</span>
      ${matched ? `<span style="display:block;margin-top:6px;font-size:13px;line-height:18px;color:${BRAND.primary};">${escapeHtml(matched)}</span>` : ""}
    </a>
  </td></tr>`;
}

/** @returns {{ subject: string, html: string, text: string }} */
export function renderDigest({ name, jobs, total, siteUrl, personal = true }) {
  const first = String(name ?? "").trim().split(/\s+/)[0];
  const count = total === 1 ? "1 new IT job" : `${total} new IT jobs`;
  const subject = personal ? `${count} matching your profile` : `${count} on TechGulf Jobs`;
  const browse = `${siteUrl}/en/jobs?sort=date`;
  const more = total - jobs.length;
  const greeting = first ? `Hi ${escapeHtml(first)}, here` : "Here";
  const intro = personal ? "are today's roles that fit your profile." : "are the latest roles on TechGulf Jobs.";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(jobs[0]?.title ?? "")} at ${escapeHtml(jobs[0]?.company ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;"><tr><td align="center" style="padding:32px 20px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
    <tr><td style="padding-bottom:32px;font-family:${FONT};font-size:17px;font-weight:700;color:${BRAND.ink};">techgulf<span style="color:${BRAND.primary};">.</span>jobs</td></tr>
    <tr><td style="font-family:${FONT};">
      <h1 style="margin:0;font-size:26px;line-height:32px;font-weight:700;letter-spacing:-0.3px;color:${BRAND.ink};">${escapeHtml(count)}${personal ? " for you" : ""}</h1>
      <p style="margin:8px 0 12px;font-size:15px;line-height:22px;color:${BRAND.muted};">${greeting} ${intro}</p>
    </td></tr>
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${jobs.map((j) => jobRow(j, siteUrl)).join("")}</table></td></tr>
    <tr><td style="padding-top:28px;">
      <a href="${escapeHtml(browse)}" style="display:block;padding:14px 20px;background:${BRAND.primary};border-radius:8px;text-align:center;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${more > 0 ? `See ${more} more` : "Browse all jobs"}</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `${count}${personal ? " for you" : ""}`, "",
    ...jobs.flatMap((j) => [`${j.title} - ${j.company}, ${place(j)}`, `${siteUrl}/en/jobs/${encodeURIComponent(j.id)}`, ""]),
    more > 0 ? `See ${more} more: ${browse}` : `Browse all jobs: ${browse}`,
  ].join("\n");

  return { subject, html, text };
}
