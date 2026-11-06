/**
 * Parser for the small LaTeX dialect used by the CV editor.
 * Runs on every keystroke in the browser, so there is no compile server. It never throws:
 * problems become diagnostics with a source position, and the rest of the document still renders.
 */

export const CV_TEMPLATES = ["classic", "modern", "compact", "gulf", "bilingual", "executive", "engineer", "fresher", "minimal", "sidebar"] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];
export const DEFAULT_ACCENT = "#0f766e";
/** Fonts people can pick. Common on Word and in job portals, so files look the same for whoever opens them. */
export const CV_FONTS = {
  arial: "Arial",
  calibri: "Calibri",
  plex: "IBM Plex Sans",
  georgia: "Georgia",
  times: "Times New Roman",
} as const;
export type CvFont = keyof typeof CV_FONTS;
/** Keeps the document well under Firestore's 1 MB limit, which it shares with the profile. */
export const CV_MAX_LENGTH = 50_000;

export type Inline =
  | { t: "text"; v: string }
  | { t: "b" | "i" | "u"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "br" };

export type ListItem = { c: Inline[]; sub?: Extract<Block, { t: "list" }> };
export type Block =
  | { t: "section" | "subsection" | "p"; c: Inline[] }
  | { t: "entry"; title: Inline[]; org: Inline[]; date: Inline[]; place: Inline[] }
  | { t: "skill"; label: Inline[]; value: Inline[] }
  | { t: "list"; ordered: boolean; items: ListItem[] }
  | { t: "pagebreak" };

export type DiagnosticCode =
  | "unknownCommand" | "missingArg" | "missingBrace" | "strayBrace" | "unknownEnv" | "envMismatch"
  | "missingEnd" | "missingBegin" | "itemOutside" | "textOutside" | "needItem" | "badUrl" | "badColor" | "badFont" | "unknownClass";

export interface CvDiagnostic { from: number; to: number; code: DiagnosticCode; arg: string }

export interface CvDocumentModel {
  template: CvTemplate;
  rtl: boolean;
  accent: string;
  /** Null keeps the template's own font. */
  font: CvFont | null;
  name: Inline[];
  headline: Inline[];
  contacts: Inline[][];
  /** Label and value pairs such as nationality and visa status, expected on Gulf CVs. */
  personal: { label: Inline[]; value: Inline[] }[];
  blocks: Block[];
  /** Content of the sidebar environment. Templates without a sidebar show it after the main content. */
  side: Block[];
  diagnostics: CvDiagnostic[];
}

/** Commands that start a new block, which also ends any paragraph or list item before them. */
const BLOCK = new Set(["documentclass", "accentcolor", "fontfamily", "name", "headline", "email", "phone", "location", "website", "personal", "section", "subsection", "entry", "skills", "newpage", "begin", "end"]);
const IGNORED = new Set(["maketitle", "noindent", "par", "centering", "hfill", "medskip", "smallskip", "bigskip", "small", "large", "normalsize", "pagestyle", "thispagestyle"]);
/** Preamble commands from other LaTeX files: accepted with their arguments, and with no effect here. */
const IGNORED_WITH_ARGS = new Set(["usepackage", "geometry", "vspace", "hspace", "setlength", "pagenumbering"]);
const SYMBOLS: Record<string, string> = { ldots: "…", dots: "…", textbackslash: "\\", textbullet: "•", textbar: "|", LaTeX: "LaTeX", TeX: "TeX", quad: "  ", qquad: "    " };
const ESCAPES = new Set(["%", "&", "_", "#", "$", "{", "}", "~", " ", "^"]);
const SPACING = new Set([",", ";", ":", "!", "/", "-"]);

const isLetter = (c: string | undefined) => !!c && /[a-zA-Z]/.test(c);

/** Accepts web, mail and phone links, and adds https to bare domains. Anything else, such as javascript:, is refused. */
export function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || /\s/.test(url)) return null;
  return `https://${url}`;
}

export function parseCv(src: string): CvDocumentModel {
  const doc: CvDocumentModel = { template: "classic", rtl: false, accent: DEFAULT_ACCENT, font: null, name: [], headline: [], contacts: [], personal: [], blocks: [], side: [], diagnostics: [] };
  let i = 0;
  let phase: "before" | "body" | "after" = "before";
  const skippedEnvs: string[] = [];
  let target = doc.blocks;
  let sidebarAt: [number, number] | null = null;

  const report = (from: number, to: number, code: DiagnosticCode, arg = "") =>
    doc.diagnostics.push({ from, to: Math.max(to, from + 1), code, arg });

  const skipComment = () => { while (i < src.length && src[i] !== "\n") i++; };

  /** Skips whitespace and comments. */
  const skipSpace = () => {
    for (;;) {
      const c = src[i];
      if (c === "%") skipComment();
      else if (c === " " || c === "\t" || c === "\n" || c === "\r") i++;
      else return;
    }
  };

  const peekCommand = () => {
    let end = i + 1;
    while (isLetter(src[end])) end++;
    if (src[end] === "*" && end > i + 1) return { name: src.slice(i + 1, end), end: end + 1 };
    return { name: src.slice(i + 1, end), end };
  };

  /** Reads inline content. "arg" stops at its closing brace, "para" at a blank line, and "item" only at a block command. */
  function inline(mode: "arg" | "para" | "item"): { nodes: Inline[]; closed: boolean } {
    const nodes: Inline[] = [];
    const text = (v: string) => {
      const last = nodes[nodes.length - 1];
      if (last?.t === "text") last.v += v; else nodes.push({ t: "text", v });
    };
    while (i < src.length) {
      const c = src[i];
      if (c === "%") {
        // As in TeX, a comment also removes its line ending, so a comment line never starts a new paragraph.
        skipComment();
        if (src[i] === "\n") { i++; while (src[i] === " " || src[i] === "\t") i++; }
        continue;
      }
      if (c === "}") {
        if (mode === "arg") { i++; return { nodes, closed: true }; }
        report(i, i + 1, "strayBrace");
        i++;
        continue;
      }
      if (c === "{") {
        const open = i++;
        const group = inline("arg");
        if (!group.closed) report(open, open + 1, "missingBrace");
        for (const n of group.nodes) { if (n.t === "text") text(n.v); else nodes.push(n); }
        continue;
      }
      if (c === "\n" || c === "\r") {
        const blank = /^\r?\n[ \t]*\r?\n/.test(src.slice(i, i + 200));
        if (blank && mode === "para") return { nodes, closed: false };
        text(" ");
        i++;
        continue;
      }
      if (c === "~") { text(" "); i++; continue; }
      if (c === "-" && src[i + 1] === "-") {
        if (src[i + 2] === "-") { text("—"); i += 3; } else { text("–"); i += 2; }
        continue;
      }
      if (c !== "\\") { text(c); i++; continue; }

      const next = src[i + 1];
      if (next === "\\") { nodes.push({ t: "br" }); i += 2; continue; }
      if (next !== undefined && ESCAPES.has(next)) { text(next); i += 2; continue; }
      if (next !== undefined && SPACING.has(next)) { if (next === "," || next === ";" || next === ":") text(" "); i += 2; continue; }
      const { name, end } = peekCommand();
      const start = i;
      // A block command inside an argument almost always means the closing brace is missing.
      if (BLOCK.has(name) || name === "item") {
        return { nodes, closed: false };
      }
      i = end;
      if (name === "textbf" || name === "textit" || name === "emph" || name === "underline") {
        const t = name === "textbf" ? "b" : name === "underline" ? "u" : "i";
        nodes.push({ t, c: arg(name, start) });
      } else if (name === "href") {
        const url = rawArg(name, start);
        const label = arg(name, start);
        const href = safeUrl(url);
        if (href) nodes.push({ t: "link", href, c: label });
        else { report(start, i, "badUrl", url); nodes.push(...label); }
      } else if (name === "url") {
        const url = rawArg(name, start);
        const href = safeUrl(url);
        if (href) nodes.push({ t: "link", href, c: [{ t: "text", v: url }] });
        else { report(start, i, "badUrl", url); text(url); }
      } else if (name === "texttt" || name === "textsc" || name === "textrm" || name === "textsf" || name === "mbox") {
        nodes.push(...arg(name, start));
      } else if (name in SYMBOLS) {
        text(SYMBOLS[name]);
        if (src[i] === "{" && src[i + 1] === "}") i += 2;
      } else if (IGNORED_WITH_ARGS.has(name)) {
        skipIgnoredArgs();
      } else if (!IGNORED.has(name)) {
        report(start, end, "unknownCommand", `\\${name}`);
      }
    }
    return { nodes, closed: false };
  }

  function skipIgnoredArgs() {
    while (src[i] === "[" || src[i] === "{") {
      const close = src[i] === "[" ? "]" : "}";
      const found = src.indexOf(close, i);
      if (found < 0) return;
      i = found + 1;
    }
  }

  /** Reads a required {argument} as inline content. */
  function arg(name: string, start: number): Inline[] {
    while (src[i] === " " || src[i] === "\t" || src[i] === "\n") i++;
    if (src[i] !== "{") { report(start, i, "missingArg", `\\${name}`); return []; }
    const open = i++;
    const { nodes, closed } = inline("arg");
    if (!closed) report(open, open + 1, "missingBrace");
    return nodes;
  }

  /** Reads a required {argument} as plain text, for URLs and names where markup has no meaning. */
  function rawArg(name: string, start: number): string {
    while (src[i] === " " || src[i] === "\t" || src[i] === "\n") i++;
    if (src[i] !== "{") { report(start, i, "missingArg", `\\${name}`); return ""; }
    const open = i++;
    let out = "";
    while (i < src.length && src[i] !== "}" && src[i] !== "\n") {
      if (src[i] === "\\" && src[i + 1] !== undefined && ESCAPES.has(src[i + 1])) { out += src[i + 1]; i += 2; }
      else out += src[i++];
    }
    if (src[i] === "}") i++; else report(open, open + 1, "missingBrace");
    return out;
  }

  function list(env: string, beginAt: number, beginEnd: number): Extract<Block, { t: "list" }> {
    const node: Extract<Block, { t: "list" }> = { t: "list", ordered: env === "enumerate", items: [] };
    for (;;) {
      skipSpace();
      if (i >= src.length) { report(beginAt, beginEnd, "missingEnd", env); return node; }
      if (src[i] !== "\\") {
        const from = i;
        inline("item");
        report(from, i, "needItem", env);
        continue;
      }
      const { name, end } = peekCommand();
      if (name === "item") {
        i = end;
        node.items.push({ c: inline("item").nodes });
      } else if (name === "end") {
        const start = i;
        i = end;
        const closing = rawArg("end", start);
        if (closing !== env) {
          // Leave it for the caller: this may be \\end{document} or the end of an outer list.
          report(beginAt, beginEnd, "missingEnd", env);
          i = start;
        }
        return node;
      } else if (name === "begin") {
        const start = i;
        i = end;
        const nested = rawArg("begin", start);
        if (nested !== "itemize" && nested !== "enumerate") { report(start, i, "unknownEnv", nested); continue; }
        const sub = list(nested, start, i);
        const last = node.items[node.items.length - 1];
        if (last) last.sub = sub; else report(start, i, "needItem", env);
      } else if (BLOCK.has(name)) {
        report(beginAt, beginEnd, "missingEnd", env);
        return node;
      } else {
        const from = i;
        inline("item");
        report(from, i, "needItem", env);
      }
    }
  }

  while (i < src.length) {
    skipSpace();
    if (i >= src.length) break;
    if (phase === "after") break;

    if (src[i] !== "\\" || !BLOCK.has(peekCommand().name) && peekCommand().name !== "item") {
      const from = i;
      const { nodes } = inline("para");
      if (i === from) i++; // A lone closing brace was already reported; never stop advancing.
      // Whitespace left behind by a command with no output is not a paragraph.
      const hasContent = nodes.some((n) => n.t !== "text" || n.v.trim());
      if (phase === "before") { if (hasContent) report(from, i, "textOutside"); continue; }
      if (hasContent) target.push({ t: "p", c: nodes });
      continue;
    }

    const { name, end } = peekCommand();
    const start = i;
    i = end;
    switch (name) {
      case "documentclass": {
        let options = "";
        if (src[i] === "[") {
          const close = src.indexOf("]", i);
          if (close > 0) { options = src.slice(i + 1, close); i = close + 1; }
        }
        const cls = rawArg(name, start);
        if ((CV_TEMPLATES as readonly string[]).includes(cls)) doc.template = cls as CvTemplate;
        else report(start, i, "unknownClass", cls);
        doc.rtl = options.split(",").some((o) => o.trim() === "rtl");
        break;
      }
      case "accentcolor": {
        const value = rawArg(name, start).trim().replace(/^#/, "");
        if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) doc.accent = `#${value}`;
        else report(start, i, "badColor", value);
        break;
      }
      case "fontfamily": {
        const value = rawArg(name, start).trim();
        if (Object.hasOwn(CV_FONTS, value)) doc.font = value as CvFont;
        else report(start, i, "badFont", value);
        break;
      }
      case "name": doc.name = arg(name, start); break;
      case "headline": doc.headline = arg(name, start); break;
      case "email": {
        const v = rawArg(name, start).trim();
        if (v) doc.contacts.push([{ t: "link", href: `mailto:${v}`, c: [{ t: "text", v }] }]);
        break;
      }
      case "phone": {
        const v = rawArg(name, start).trim();
        if (v) doc.contacts.push([{ t: "link", href: `tel:${v.replace(/[^\d+]/g, "")}`, c: [{ t: "text", v }] }]);
        break;
      }
      case "location": {
        const nodes = arg(name, start);
        if (nodes.length) doc.contacts.push(nodes);
        break;
      }
      case "website": {
        const v = rawArg(name, start).trim();
        const href = safeUrl(v);
        if (href) doc.contacts.push([{ t: "link", href, c: [{ t: "text", v: v.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "") }] }]);
        else report(start, i, "badUrl", v);
        break;
      }
      case "personal": {
        const label = arg(name, start), value = arg(name, start);
        doc.personal.push({ label, value });
        break;
      }
      case "section": case "subsection":
        if (phase === "before") report(start, end, "textOutside");
        target.push({ t: name, c: arg(name, start) });
        break;
      case "entry": {
        if (phase === "before") report(start, end, "textOutside");
        const title = arg(name, start), org = arg(name, start), date = arg(name, start), place = arg(name, start);
        target.push({ t: "entry", title, org, date, place });
        break;
      }
      case "skills": {
        if (phase === "before") report(start, end, "textOutside");
        const label = arg(name, start), value = arg(name, start);
        target.push({ t: "skill", label, value });
        break;
      }
      case "newpage": target.push({ t: "pagebreak" }); break;
      case "item": report(start, end, "itemOutside"); inline("para"); break;
      case "begin": {
        const env = rawArg(name, start);
        if (env === "document") phase = "body";
        else if (env === "sidebar" && !sidebarAt) { sidebarAt = [start, i]; target = doc.side; }
        else if (env === "itemize" || env === "enumerate") {
          if (phase === "before") report(start, i, "textOutside");
          target.push(list(env, start, i));
        } else { report(start, i, "unknownEnv", env); skippedEnvs.push(env); }
        break;
      }
      case "end": {
        const env = rawArg(name, start);
        const skipped = skippedEnvs.lastIndexOf(env);
        if (env === "sidebar" && sidebarAt) { sidebarAt = null; target = doc.blocks; }
        else if (env === "document" && phase === "body") {
          if (sidebarAt) { report(sidebarAt[0], sidebarAt[1], "missingEnd", "sidebar"); sidebarAt = null; target = doc.blocks; }
          phase = "after";
        }
        else if (skipped >= 0) skippedEnvs.splice(skipped, 1);
        else report(start, i, "envMismatch", env);
        break;
      }
    }
  }

  if (phase === "before") report(0, 1, "missingBegin");
  if (phase === "body") report(Math.max(0, src.length - 1), src.length, "missingEnd", "document");
  return doc;
}

/** Changes the template on the \documentclass line and leaves everything else in the source alone. */
export function setTemplate(src: string, template: CvTemplate): string {
  const line = /^([ \t]*\\documentclass(?:\[[^\]\n]*\])?\{)[^}\n]*(\})/m;
  return line.test(src) ? src.replace(line, `$1${template}$2`) : `\\documentclass{${template}}\n${src}`;
}

/** Sets the font line in the source, or removes it for the template's own font. */
export function setFont(src: string, font: CvFont | null): string {
  const line = /^[ \t]*\\fontfamily\{[^}\n]*\}[ \t]*\n?/m;
  if (!font) return src.replace(line, "");
  const command = `\\fontfamily{${font}}`;
  if (line.test(src)) return src.replace(line, `${command}\n`);
  const classLine = /^[ \t]*\\documentclass(?:\[[^\]\n]*\])?\{[^}\n]*\}[ \t]*\n?/m;
  const match = classLine.exec(src);
  if (!match) return `${command}\n${src}`;
  const at = match.index + match[0].length;
  return `${src.slice(0, at)}${match[0].endsWith("\n") ? "" : "\n"}${command}\n${src.slice(at)}`;
}

/** Escapes plain text so it can be placed safely inside the source. */
export function escapeTex(text: string): string {
  return text.replace(/[\\%&_#${}~^]/g, (c) => (c === "\\" ? "\\textbackslash{}" : `\\${c}`));
}
