import { CV_FONTS, type Block, type CvDocumentModel, type CvTemplate, type Inline } from "@/lib/cv-latex";

const SERIF: readonly CvTemplate[] = ["classic", "executive"];
const CENTRED: readonly CvTemplate[] = ["classic", "bilingual", "fresher"];
/** Body text size in half-points, as Word measures it. */
const BODY_SIZE: Partial<Record<CvTemplate, number>> = { compact: 19, engineer: 19, fresher: 20, sidebar: 20, executive: 22 };
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Word files have no sidebar: its content follows the main content, which also reads better in job portals. */
const allBlocks = (doc: CvDocumentModel): Block[] => [...doc.blocks, ...doc.side];
const accentOf = (doc: CvDocumentModel) => (doc.template === "minimal" ? "000000" : expand(doc.accent));
const expand = (hex: string) => {
  const h = hex.replace("#", "");
  return h.length === 3 ? [...h].map((c) => c + c).join("") : h;
};

export function plainText(nodes: Inline[]): string {
  return nodes.map((n) => (n.t === "text" ? n.v : n.t === "br" ? " " : plainText(n.c))).join("").replace(/\s+/g, " ").trim();
}

/** A safe file name from the person's name. Keeps Arabic and other letters. */
export function cvFileName(doc: CvDocumentModel): string {
  const name = plainText(doc.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").trim();
  return name ? `${name} - CV` : "CV";
}

export async function toDocxBlob(doc: CvDocumentModel): Promise<Blob> {
  // About 200 KB, so it loads only when someone downloads a Word file.
  const { AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, LevelFormat, Packer, PageBreak, Paragraph, TabStopType, TextRun } = await import("docx");

  const fontName = doc.font ? CV_FONTS[doc.font] : SERIF.includes(doc.template) ? "Georgia" : "Arial";
  const font = { ascii: fontName, hAnsi: fontName, cs: "Arial", eastAsia: fontName };
  const size = BODY_SIZE[doc.template] ?? 21;
  const accent = accentOf(doc);
  const usableWidth = 11906 - 850 * 2;
  type Style = { bold?: boolean; italics?: boolean; underline?: boolean; size?: number; color?: string };

  const run = (text: string, s: Style = {}) => new TextRun({
    text, font, size: s.size ?? size, sizeComplexScript: s.size ?? size, color: s.color,
    bold: s.bold, boldComplexScript: s.bold, italics: s.italics, italicsComplexScript: s.italics,
    underline: s.underline ? {} : undefined, ...(ARABIC.test(text) ? { rightToLeft: true } : {}),
  });
  const runs = (nodes: Inline[], s: Style = {}): (InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>)[] =>
    nodes.flatMap((n) => {
      switch (n.t) {
        case "text": return [run(n.v, s)];
        case "br": return [new TextRun({ break: 1 })];
        case "b": return runs(n.c, { ...s, bold: true });
        case "i": return runs(n.c, { ...s, italics: true });
        case "u": return runs(n.c, { ...s, underline: true });
        case "link": return [new ExternalHyperlink({ link: n.href, children: runs(n.c, { ...s, underline: true }) as InstanceType<typeof TextRun>[] })];
      }
    });

  // Only set when needed: the library writes the right-to-left flag even for a value of false.
  const dir = doc.rtl ? { bidirectional: true } : {};
  const headerAlign = CENTRED.includes(doc.template) ? AlignmentType.CENTER : AlignmentType.START;
  const joined = (items: Inline[][]) => items.flatMap((item, i) => [...(i ? [run("  |  ", { color: "64748B" })] : []), ...runs(item)]);
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ ...dir, alignment: headerAlign, heading: HeadingLevel.TITLE, children: runs(doc.name, { bold: true, size: 44, color: "0F172A" }) }),
  ];
  if (doc.headline.length) children.push(new Paragraph({ ...dir, alignment: headerAlign, children: runs(doc.headline, { size: 24, color: "475569" }) }));
  if (doc.contacts.length) children.push(new Paragraph({ ...dir, alignment: headerAlign, spacing: { before: 40 }, children: joined(doc.contacts) }));
  // Plain text under the contact details, where the research says Gulf recruiters and parsers look for it.
  for (const row of doc.personal) {
    children.push(new Paragraph({ ...dir, alignment: headerAlign, children: [...runs(row.label, { bold: true }), run(": ", { bold: true }), ...runs(row.value)] }));
  }

  const list = (block: Extract<Block, { t: "list" }>, level: number) => {
    block.items.forEach((item) => {
      children.push(new Paragraph({
        ...dir, spacing: { after: 30 },
        numbering: { reference: block.ordered ? "cv-numbers" : "cv-bullets", level: Math.min(level, 1) },
        children: runs(item.c),
      }));
      if (item.sub) list(item.sub, level + 1);
    });
  };

  for (const block of allBlocks(doc)) {
    switch (block.t) {
      case "section":
        children.push(new Paragraph({
          ...dir, heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 200, after: 80 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
          children: runs(block.c, { bold: true, size: size + 3, color: accent }),
        }));
        break;
      case "subsection":
        children.push(new Paragraph({ ...dir, heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 120, after: 40 }, children: runs(block.c, { bold: true }) }));
        break;
      case "p":
        children.push(new Paragraph({ ...dir, spacing: { after: 60 }, children: runs(block.c) }));
        break;
      case "skill":
        children.push(new Paragraph({ ...dir, spacing: { after: 40 }, children: [...runs(block.label, { bold: true }), run(": ", { bold: true }), ...runs(block.value)] }));
        break;
      case "entry": {
        const muted = { color: "475569" };
        if (doc.rtl) {
          // Tab stops and mixed-direction dates don't lay out reliably in right-to-left paragraphs, so the details go on one line.
          children.push(new Paragraph({ ...dir, keepNext: true, spacing: { before: 100 }, children: runs(block.title, { bold: true }) }));
          const details = [block.org, block.place, block.date].filter((part) => part.length);
          if (details.length) children.push(new Paragraph({ ...dir, spacing: { after: 30 }, children: details.flatMap((part, i) => [...(i ? [run("  |  ", muted)] : []), ...runs(part, muted)]) }));
          break;
        }
        const tabStops = [{ type: TabStopType.RIGHT, position: usableWidth }];
        const tab = () => new TextRun({ text: "\t", font, size });
        children.push(new Paragraph({ keepNext: true, spacing: { before: 100 }, tabStops, children: [...runs(block.title, { bold: true }), ...(block.date.length ? [tab(), ...runs(block.date, muted)] : [])] }));
        if (block.org.length || block.place.length) {
          children.push(new Paragraph({ tabStops, spacing: { after: 30 }, children: [...runs(block.org, muted), ...(block.place.length ? [tab(), ...runs(block.place, muted)] : [])] }));
        }
        break;
      }
      case "list": list(block, 0); break;
      case "pagebreak": children.push(new Paragraph({ children: [new PageBreak()] })); break;
    }
  }

  const indent = (level: number) => ({ paragraph: { indent: { start: 300 + level * 300, hanging: 220 } } });
  const file = new Document({
    title: cvFileName(doc),
    creator: plainText(doc.name) || "CV",
    description: "",
    numbering: { config: [
      { reference: "cv-bullets", levels: [0, 1].map((level) => ({ level, format: LevelFormat.BULLET, text: level ? "◦" : "•", alignment: AlignmentType.START, style: indent(level) })) },
      { reference: "cv-numbers", levels: [0, 1].map((level) => ({ level, format: LevelFormat.DECIMAL, text: `%${level + 1}.`, alignment: AlignmentType.START, style: indent(level) })) },
    ] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, right: 850, bottom: 850, left: 850 } } }, children }],
  });
  const blob = await Packer.toBlob(file);
  return new Blob([blob], { type: WORD_MIME });
}

const esc = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function htmlInline(nodes: Inline[]): string {
  return nodes.map((n) => {
    switch (n.t) {
      case "text": return esc(n.v);
      case "br": return "<br>";
      case "b": return `<b>${htmlInline(n.c)}</b>`;
      case "i": return `<i>${htmlInline(n.c)}</i>`;
      case "u": return `<u>${htmlInline(n.c)}</u>`;
      case "link": return `<a href="${esc(n.href)}">${htmlInline(n.c)}</a>`;
    }
  }).join("");
}

function htmlList(block: Extract<Block, { t: "list" }>): string {
  const tag = block.ordered ? "ol" : "ul";
  return `<${tag}>${block.items.map((item) => `<li>${htmlInline(item.c)}${item.sub ? htmlList(item.sub) : ""}</li>`).join("")}</${tag}>`;
}

/**
 * A .doc made the way browsers can: Word-flavoured HTML, which Word and most converters open as a document.
 * It is not the binary Word 97 format, which can't be produced here, so DOCX is the better choice wherever it's accepted.
 */
export function toDocBlob(doc: CvDocumentModel): Blob {
  const family = doc.font
    ? `'${CV_FONTS[doc.font]}', ${doc.font === "georgia" || doc.font === "times" ? "serif" : "sans-serif"}`
    : SERIF.includes(doc.template) ? "Georgia, serif" : "Arial, sans-serif";
  const align = CENTRED.includes(doc.template) ? "center" : doc.rtl ? "right" : "left";
  const accent = `#${accentOf(doc)}`;
  const body = allBlocks(doc).map((block) => {
    switch (block.t) {
      case "section": return `<h2>${htmlInline(block.c)}</h2>`;
      case "subsection": return `<h3>${htmlInline(block.c)}</h3>`;
      case "p": return `<p>${htmlInline(block.c)}</p>`;
      case "skill": return `<p><b>${htmlInline(block.label)}:</b> ${htmlInline(block.value)}</p>`;
      case "list": return htmlList(block);
      case "pagebreak": return `<br clear="all" style="page-break-before:always">`;
      case "entry": {
        const line = (a: Inline[], b: Inline[], bold: boolean) => `<tr><td>${bold ? `<b>${htmlInline(a)}</b>` : htmlInline(a)}</td><td class="end">${htmlInline(b)}</td></tr>`;
        return `<table width="100%" class="entry">${line(block.title, block.date, true)}${block.org.length || block.place.length ? line(block.org, block.place, false) : ""}</table>`;
      }
    }
  }).join("\n");
  const contacts = doc.contacts.map(htmlInline).join(" &nbsp;|&nbsp; ");
  const personal = doc.personal.map((row) => `<p class="head"><b>${htmlInline(row.label)}:</b> ${htmlInline(row.value)}</p>`).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" dir="${doc.rtl ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><title>${esc(cvFileName(doc))}</title>
<style>
@page WordSection { size: 595.3pt 841.9pt; margin: 42pt; }
div.WordSection { page: WordSection; }
body { font-family: ${family}; font-size: 10.5pt; color: #1e293b; }
h1 { font-size: 22pt; margin: 0; color: #0f172a; text-align: ${align}; }
h2 { font-size: 12pt; margin: 12pt 0 4pt; color: ${accent}; border-bottom: 1pt solid ${accent}; }
h3 { font-size: 10.5pt; margin: 8pt 0 2pt; }
p { margin: 0 0 3pt; }
.head { text-align: ${align}; }
.entry { margin-top: 5pt; border-collapse: collapse; }
.entry td { padding: 0; font-size: 10.5pt; }
.end { text-align: ${doc.rtl ? "left" : "right"}; color: #475569; }
ul, ol { margin: 2pt 0 4pt; }
</style></head>
<body><div class="WordSection">
<h1>${htmlInline(doc.name)}</h1>
${doc.headline.length ? `<p class="head">${htmlInline(doc.headline)}</p>` : ""}
${contacts ? `<p class="head">${contacts}</p>` : ""}
${personal}
${body}
</div></body></html>`;
  // The byte order mark tells Word the file is UTF-8, which keeps Arabic text intact.
  return new Blob(["﻿", html], { type: "application/msword" });
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers start the download a moment after the click.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
