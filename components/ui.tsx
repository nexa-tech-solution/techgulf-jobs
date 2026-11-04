import Link from "next/link";
import type { Company } from "@/lib/types";

export function Badge({ tone, children }: { tone: "success" | "warning" | "accent" | "muted" | "danger"; children: React.ReactNode }) {
  const cls = {
    success: "text-success border-success/30 bg-success/10",
    warning: "text-warning border-warning/30 bg-warning/10",
    accent: "text-accent border-accent/40 bg-accent/10",
    danger: "text-danger border-danger/30 bg-danger/10",
    muted: "text-muted border-line",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span dir="ltr" className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</span>;
}

export function Logo({ company, size = 40 }: { company: Pick<Company, "name" | "color"> & { logo?: string }; size?: number }) {
  if (company.logo) return (
    // White plate: many icons are transparent and would vanish in dark mode.
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white" style={{ width: size, height: size }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- small remote icon, validated by the job sync */}
      <img src={company.logo} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-[80%] w-[80%] object-contain" />
    </span>
  );
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg font-semibold text-white"
      style={{ width: size, height: size, background: company.color, fontSize: size * 0.42 }}
      aria-hidden
    >
      {company.name[0].toUpperCase()}
    </span>
  );
}

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost"; className?: string }) {
  const v = variant === "primary" ? "bg-primary text-on-primary" : "border border-line bg-surface/60 text-ink backdrop-blur hover:border-primary";
  return <Link href={href} className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold ${v} ${className}`}>{children}</Link>;
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <h1 className="max-w-3xl text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-muted">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export const inputCls = "h-11 w-full rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";
