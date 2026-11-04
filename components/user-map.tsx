"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n";
import type { Country } from "@/lib/types";
import { IS_SAMPLE_DATA, USER_LOCATIONS, projectPoint, type UserLocation } from "@/lib/community-map";
import { MAP_HEIGHT, MAP_SHAPES, MAP_WIDTH } from "@/lib/map-shapes";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const MAX_RADIUS = 20;
const MAX_USERS = Math.max(...USER_LOCATIONS.map((l) => l.users));
// Area, not radius, carries the value.
const radius = (users: number) => MAX_RADIUS * Math.sqrt(users / MAX_USERS);

const TOTAL = USER_LOCATIONS.reduce((sum, l) => sum + l.users, 0);
const COUNTRIES = Object.entries(
  USER_LOCATIONS.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.country]: (acc[l.country] ?? 0) + l.users }), {}),
).map(([code, users]) => ({ code: code as Country, users })).sort((a, b) => b.users - a.users);
const TOP_SHARE = COUNTRIES[0].users;
// Larger bubbles first, so smaller neighbours stay visible and clickable on top.
const BUBBLES = [...USER_LOCATIONS].sort((a, b) => b.users - a.users);

const HUB = USER_LOCATIONS.find((l) => l.slug === "dubai")!;
// A gentle upward curve from the hub to each city.
function arcPath(l: UserLocation) {
  const a = projectPoint(HUB.lat, HUB.lon);
  const b = projectPoint(l.lat, l.lon);
  const lift = Math.hypot(b.x - a.x, b.y - a.y) * 0.22;
  return `M${a.x} ${a.y}Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - lift} ${b.x} ${b.y}`;
}

function labelProps(l: UserLocation, x: number, y: number) {
  const r = radius(l.users) + 5;
  switch (l.label) {
    case "left": return { x: x - r, y: y + 4, textAnchor: "end" as const };
    case "above": return { x, y: y - r, textAnchor: "middle" as const };
    case "below": return { x, y: y + r + 9, textAnchor: "middle" as const };
    default: return { x: x + r, y: y + 4, textAnchor: "start" as const };
  }
}

export function UserMap({ d, lang }: { d: Dict; lang: Locale }) {
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<Country | null>(null);
  const t = d.userMap;
  const cityName = (l: UserLocation) => (lang === "ar" ? l.ar : l.name);
  const active = USER_LOCATIONS.find((l) => l.slug === activeCity);
  const tip = active && projectPoint(active.lat, active.lon);
  const flipTip = tip && tip.x > MAP_WIDTH * 0.7;

  return (
    <div className="neon-card grid overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-[1fr_320px]">
      <div className="neon-panel relative border-b border-line lg:border-b-0 lg:border-e" dir="ltr">
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="block h-auto w-full" role="group" aria-label={t.mapLabel}>
          {MAP_SHAPES.map((s) => {
            const highlighted = s.code && s.code === (activeCountry ?? active?.country);
            return (
              <path key={s.code ?? "other"} d={s.d} fill="none" strokeLinecap="round" strokeWidth={2.8}
                stroke={s.code ? "var(--primary)" : "color-mix(in srgb, var(--ink) 30%, transparent)"} opacity={s.code ? (highlighted ? 0.95 : 0.42) : 0.6} style={{ transition: "opacity .15s" }} />
            );
          })}
          {BUBBLES.filter((l) => l.slug !== HUB.slug).map((l) => {
            const on = activeCity === l.slug || activeCountry === l.country;
            return <path key={l.slug} d={arcPath(l)} fill="none" stroke="var(--primary)" strokeWidth={on ? 1.6 : 1} strokeLinecap="round" opacity={on ? 1 : 0.7} className="map-arc pointer-events-none" />;
          })}
          {BUBBLES.map((l, i) => {
            const { x, y } = projectPoint(l.lat, l.lon);
            const r = radius(l.users);
            const on = activeCity === l.slug || activeCountry === l.country;
            return (
              <g key={l.slug} tabIndex={0} role="img" aria-label={`${cityName(l)}: ${fmt(l.users)} ${t.users}`} className="cursor-pointer outline-none"
                onMouseEnter={() => setActiveCity(l.slug)} onMouseLeave={() => setActiveCity(null)}
                onFocus={() => setActiveCity(l.slug)} onBlur={() => setActiveCity(null)} onClick={() => setActiveCity(l.slug)}>
                <circle cx={x} cy={y} r={Math.max(r, 12)} fill="transparent" />
                <circle cx={x} cy={y} r={r * 1.7} fill="none" stroke="var(--primary)" strokeWidth={1} className="map-pulse pointer-events-none" style={{ animationDelay: `${i * 0.2}s` }} />
                <circle cx={x} cy={y} r={r} fill="var(--primary)" fillOpacity={on ? 0.4 : 0.2} stroke="var(--primary)" strokeOpacity={0.7} strokeWidth={1} style={{ transition: "fill-opacity .15s" }} />
                <circle cx={x} cy={y} r={2.5} fill="var(--primary)" className="map-core" />
              </g>
            );
          })}
          {/* Labels sit above every bubble and never intercept the pointer. */}
          {USER_LOCATIONS.filter((l) => l.label).map((l) => {
            const { x, y } = projectPoint(l.lat, l.lon);
            return (
              <text key={l.slug} {...labelProps(l, x, y)} fontSize={12} fontWeight={500} fill="var(--ink)" paintOrder="stroke" stroke="var(--surface-2)" strokeWidth={3} strokeLinejoin="round"
                className="pointer-events-none hidden font-mono sm:block">{cityName(l)}</text>
            );
          })}
        </svg>

        {active && tip && (
          <div role="status" dir={lang === "ar" ? "rtl" : "ltr"} className="pointer-events-none absolute z-10 w-max rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-md"
            style={{
              left: `${(tip.x / MAP_WIDTH) * 100}%`, top: `${(tip.y / MAP_HEIGHT) * 100}%`,
              transform: `translate(${flipTip ? "calc(-100% - 16px)" : "16px"}, -50%)`,
            }}>
            <p className="font-semibold">{cityName(active)}</p>
            <p className="text-muted">{d.country[active.country]} · <span dir="ltr" className="font-medium text-ink">{fmt(active.users)}</span> {t.users}</p>
          </div>
        )}

        <div className="absolute bottom-3 left-3 hidden items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted sm:flex" dir={lang === "ar" ? "rtl" : "ltr"}>
          <span>{t.legend}</span>
          {[5000, 25000].map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5">
              <span className="rounded-full bg-primary/70" style={{ width: radius(n) * 1.4, height: radius(n) * 1.4 }} aria-hidden />
              <span dir="ltr">{fmt(n)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col p-5">
        <p className="text-sm text-muted">{t.total}</p>
        <p className="mt-1 font-mono text-4xl font-medium tracking-tight text-primary" dir="ltr" style={{ textAlign: "start" }}>{fmt(TOTAL)}</p>
        <p className="mt-1 text-sm text-muted">{t.across.replace("{cities}", String(USER_LOCATIONS.length)).replace("{countries}", String(COUNTRIES.length))}</p>
        <ul className="mt-5 border-t border-line pt-2" onMouseLeave={() => setActiveCountry(null)}>
          {COUNTRIES.map((c) => (
            <li key={c.code}>
              <Link href={`/${lang}/jobs?country=${c.code}`} className="block rounded-lg px-2 py-2 -mx-2 hover:bg-surface-2 focus-visible:bg-surface-2"
                onMouseEnter={() => setActiveCountry(c.code)} onFocus={() => setActiveCountry(c.code)} onBlur={() => setActiveCountry(null)}>
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{d.country[c.code]}</span>
                  <span className="font-mono text-muted" dir="ltr">{fmt(c.users)}</span>
                </span>
                <span className="mt-1.5 block h-1 rounded-full bg-line" aria-hidden>
                  <span className="block h-1 rounded-full bg-primary" style={{ width: `${(c.users / TOP_SHARE) * 100}%` }} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {IS_SAMPLE_DATA && <p className="mt-auto pt-4 text-xs text-muted">{t.sampleNote}</p>}
      </div>
    </div>
  );
}
