import type { CareerBlock, CareerCover } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { CheckIcon } from "./icons";

const TONE = {
  good: { bar: "border-success", dot: "bg-success", bg: "bg-success/10" },
  info: { bar: "border-primary/50", dot: "bg-primary", bg: "bg-primary/5" },
  bad: { bar: "border-danger", dot: "bg-danger", bg: "bg-danger/5" },
};
const STACK_OPACITY = [1, 0.75, 0.55, 0.4, 0.28];

/** Drawn with theme colours, so covers follow dark mode and stay sharp at any size. */
export function GuideCover({ kind }: { kind: CareerCover }) {
  const line = (x: number, y: number, w: number, o = 0.25) => <rect key={`${x}${y}`} x={x} y={y} width={w} height="6" rx="3" fill="var(--primary)" opacity={o} />;
  const page = <rect x="110" y="14" width="100" height="112" rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />;
  const art: Record<CareerCover, React.ReactNode> = {
    jd: <>{page}{line(122, 30, 76, 0.7)}{line(122, 48, 62)}<rect x="118" y="60" width="84" height="16" rx="4" fill="var(--primary)" opacity="0.18" />{line(122, 65, 70, 0.7)}{line(122, 86, 66)}{line(122, 102, 48)}<circle cx="214" cy="104" r="20" fill="none" stroke="var(--primary)" strokeWidth="5" /><path d="M229 119l16 16" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" /></>,
    cv: <>{page}<circle cx="134" cy="38" r="11" fill="var(--primary)" opacity="0.7" />{line(152, 30, 46, 0.7)}{line(152, 42, 32)}{line(122, 62, 76, 0.45)}{line(122, 76, 66)}{line(122, 90, 72)}{line(122, 104, 54)}<circle cx="216" cy="112" r="17" fill="var(--primary)" /><path d="M208 112l6 6 11-12" stroke="var(--on-primary)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    apply: <>{[[50, 0.3], [120, 0.5], [190, 0.75], [260, 1]].map(([x, o], i) => <g key={x}><circle cx={x} cy="70" r="20" fill="var(--primary)" opacity={o} />{i < 3 && <path d={`M${x + 25} 70h20`} stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />}</g>)}<path d="M251 70l7 7 12-14" stroke="var(--on-primary)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    interview: <><rect x="42" y="26" width="128" height="62" rx="14" fill="var(--primary)" opacity="0.8" /><path d="M66 88v22l24-22z" fill="var(--primary)" opacity="0.8" />{line(60, 44, 90, 0.9)}{line(60, 60, 62, 0.9)}<rect x="150" y="64" width="128" height="50" rx="14" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" /><text x="214" y="97" textAnchor="middle" fontFamily="monospace" fontSize="22" fontWeight="700" fill="var(--primary)">{"{ }"}</text></>,
    salary: <>{[[70, 36], [122, 56], [174, 78], [226, 104]].map(([x, h]) => <rect key={x} x={x} y={122 - h} width="36" height={h} rx="5" fill="var(--primary)" opacity={0.25 + h / 150} />)}<path d="M66 72l54-22 50-6 62-30" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M222 12l11 2-3 11" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    offer: <><path d="M160 14l52 18v36c0 30-24 50-52 60-28-10-52-30-52-60V32z" fill="var(--primary)" opacity="0.14" stroke="var(--primary)" strokeWidth="4" /><path d="M136 70l17 17 32-36" stroke="var(--primary)" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
  };
  return <svg viewBox="0 0 320 140" className="h-full w-full bg-surface-2" aria-hidden>{art[kind]}</svg>;
}

const Heading = ({ children, note }: { children: React.ReactNode; note?: string }) => (
  <div className="mb-4"><h2 className="text-xl font-semibold tracking-tight">{children}</h2>{note && <p className="mt-1 text-sm text-muted">{note}</p>}</div>
);

export function CareerBlockView({ block, d }: { block: CareerBlock; d: Dict }) {
  switch (block.type) {
    case "flow":
      return (
        <section>
          <Heading note={block.note}>{block.title}</Heading>
          <ol className="grid gap-3 md:auto-cols-fr md:grid-flow-col">
            {block.items.map((x, i) => (
              <li key={x.t} className="relative rounded-xl border border-line bg-surface p-4 md:pt-12">
                <span className="absolute start-4 top-4 hidden h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary md:grid">{i + 1}</span>
                {i < block.items.length - 1 && <span className="absolute -end-[17px] top-[1.15rem] z-10 hidden h-[22px] w-[22px] place-items-center rounded-full border border-line bg-surface text-xs text-primary md:grid rtl:rotate-180" aria-hidden>→</span>}
                <p className="font-semibold"><span className="me-2 text-primary md:hidden">{i + 1}.</span>{x.t}</p>
                <p className="mt-1 text-sm text-muted">{x.d}</p>
              </li>
            ))}
          </ol>
        </section>
      );
    case "annotated":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <p className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-4 py-2.5 font-mono text-xs text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/50" /><span className="h-2.5 w-2.5 rounded-full bg-primary/40" /><span className="h-2.5 w-2.5 rounded-full bg-success/50" /><span className="ms-2">{block.doc}</span>
            </p>
            <ul className="divide-y divide-line">
              {block.lines.map((l) => (
                <li key={l.text} className="grid gap-2 p-4 md:grid-cols-2 md:gap-6">
                  <p className={`border-s-4 ps-3 font-medium ${TONE[l.tone].bar}`}>{l.text}</p>
                  <p className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${TONE[l.tone].bg}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[l.tone].dot}`} />{l.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "compare":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="grid gap-3 md:grid-cols-2">
            {([[block.badLabel, block.bad, "bad"], [block.goodLabel, block.good, "good"]] as const).map(([label, items, tone]) => (
              <div key={label} className={`rounded-2xl border p-5 ${tone === "good" ? "border-success/40 bg-success/5" : "border-danger/30 bg-danger/5"}`}>
                <p className={`font-semibold ${tone === "good" ? "text-success" : "text-danger"}`}>{label}</p>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {items.map((x) => <li key={x} className="flex gap-2"><span aria-hidden className={`font-bold ${tone === "good" ? "text-success" : "text-danger"}`}>{tone === "good" ? "✓" : "✕"}</span>{x}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    case "formula":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {block.parts.map((p, i) => <span key={p} className="contents">{i > 0 && <span className="text-muted" aria-hidden>+</span>}<span className="rounded-lg bg-primary/10 px-3 py-2 text-primary">{p}</span></span>)}
            </p>
            <p className="mt-4 border-s-4 border-primary ps-3 text-sm">{block.example}</p>
          </div>
        </section>
      );
    case "stack":
      return (
        <section>
          <Heading note={block.note}>{block.title}</Heading>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex h-10 gap-0.5 overflow-hidden rounded-lg" aria-hidden>
              {block.segments.map((s, i) => <span key={s.label} className="bg-primary" style={{ width: `${s.weight}%`, opacity: STACK_OPACITY[i] }} />)}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {block.segments.map((s, i) => (
                <li key={s.label} className="flex gap-2.5 text-sm">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-sm bg-primary" style={{ opacity: STACK_OPACITY[i] }} />
                  <span><span className="font-medium">{s.label}</span><span className="block text-muted">{s.note}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">{d.guidesPage.roughGuide}</p>
          </div>
        </section>
      );
    case "checklist":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <ul className="grid gap-2 sm:grid-cols-2">
            {block.items.map((x) => <li key={x} className="flex gap-2.5 rounded-xl border border-line bg-surface p-3.5 text-sm"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}
          </ul>
        </section>
      );
    case "message":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="space-y-2 rounded-2xl border border-line bg-surface-2 p-5">
            {block.lines.map((l) => <p key={l} className="max-w-xl rounded-2xl rounded-es-sm bg-surface px-4 py-3 text-sm shadow-sm">{l}</p>)}
          </div>
        </section>
      );
    case "tip":
      return <p className="rounded-2xl bg-primary/10 p-5 font-medium">{block.text}</p>;
  }
}
