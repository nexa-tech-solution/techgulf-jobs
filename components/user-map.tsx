"use client";

import { useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import type { Country } from "@/lib/types";
import { IS_SAMPLE_DATA, USER_LOCATIONS, projectPoint, type UserLocation } from "@/lib/community-map";
import { MAP_HEIGHT, MAP_SHAPES, MAP_WIDTH } from "@/lib/map-shapes";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const MAX_RADIUS = 17;
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
              <path key={s.code ?? "other"} d={s.d} fill="none" strokeLinecap="round" strokeWidth={s.code ? 2.6 : 2}
                stroke={s.code ? "var(--primary)" : "var(--ink)"} opacity={s.code ? (highlighted ? 0.6 : 0.28) : 0.09} style={{ transition: "opacity .15s" }} />
            );
          })}
          {/* Seismic waves: bigger cities reach further, and the delays keep cities out of step. */}
          <g aria-hidden className="pointer-events-none">
            {BUBBLES.flatMap((l, i) => {
              const { x, y } = projectPoint(l.lat, l.lon);
              return [0, 1, 2].map((wave) => (
                <circle key={`${l.slug}-${wave}`} cx={x} cy={y} r={radius(l.users) * 2.2 + 12} className="map-quake"
                  style={{ animationDelay: `${(i * 0.73) % 4.2 + wave * 1.4}s` }} />
              ));
            })}
          </g>
          {BUBBLES.map((l) => {
            const { x, y } = projectPoint(l.lat, l.lon);
            const r = radius(l.users);
            const on = activeCity === l.slug || activeCountry === l.country;
            return (
              <g key={l.slug} tabIndex={0} role="img" aria-label={`${cityName(l)}: ${fmt(l.users)} ${t.users}`} className="cursor-pointer outline-none"
                onMouseEnter={() => setActiveCity(l.slug)} onMouseLeave={() => setActiveCity(null)}
                onFocus={() => setActiveCity(l.slug)} onBlur={() => setActiveCity(null)} onClick={() => setActiveCity(l.slug)}>
                <circle cx={x} cy={y} r={Math.max(r, 12)} fill="transparent" />
                <circle cx={x} cy={y} r={r} fill="var(--primary)" fillOpacity={on ? 1 : 0.85} stroke="var(--surface-2)" strokeWidth={2} style={{ transition: "fill-opacity .15s" }} />
              </g>
            );
          })}
          {/* Labels sit above every bubble and never intercept the pointer. */}
          {USER_LOCATIONS.filter((l) => l.label).map((l) => {
            const { x, y } = projectPoint(l.lat, l.lon);
            return (
              <text key={l.slug} {...labelProps(l, x, y)} fontSize={12} fontWeight={500} fill="var(--ink)" paintOrder="stroke" stroke="var(--surface-2)" strokeWidth={3} strokeLinejoin="round"
                className="pointer-events-none hidden sm:block">{cityName(l)}</text>
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

        <div className="absolute bottom-3 left-3 hidden items-center gap-3 px-1 text-xs text-muted sm:flex" dir={lang === "ar" ? "rtl" : "ltr"}>
          <span>{t.legend}</span>
          {[5000, 25000].map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5">
              <span className="rounded-full bg-primary/85" style={{ width: radius(n) * 2, height: radius(n) * 2 }} aria-hidden />
              <span dir="ltr">{fmt(n)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col p-5">
        <p className="text-sm text-muted">{t.total}</p>
        <p className="mt-1 text-4xl font-bold tracking-tight" dir="ltr" style={{ textAlign: "start" }}>{fmt(TOTAL)}</p>
        <p className="mt-1 text-sm text-muted">{t.across.replace("{cities}", String(USER_LOCATIONS.length)).replace("{countries}", String(COUNTRIES.length))}</p>
        <ul className="mt-5 border-t border-line pt-2" onMouseLeave={() => setActiveCountry(null)}>
          {COUNTRIES.map((c) => (
            <li key={c.code}>
              <div className="py-2" onMouseEnter={() => setActiveCountry(c.code)}>
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{d.country[c.code]}</span>
                  <span className="text-muted" dir="ltr">{fmt(c.users)}</span>
                </span>
                <span className="mt-1.5 block h-1 rounded-full bg-line" aria-hidden>
                  <span className="block h-1 rounded-full bg-primary" style={{ width: `${(c.users / TOP_SHARE) * 100}%` }} />
                </span>
              </div>
            </li>
          ))}
        </ul>
        {IS_SAMPLE_DATA && <p className="mt-auto pt-4 text-xs text-muted">{t.sampleNote}</p>}
      </div>
    </div>
  );
}
