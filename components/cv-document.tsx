import { Fragment, type CSSProperties } from "react";
import type { Block, CvDocumentModel, CvFont, Inline } from "@/lib/cv-latex";

// Calibri falls back to its metric twin, then Arial, on devices without it. Arabic always uses the Arabic face.
const ARABIC_FACE = "var(--font-plex-arabic)";
const FONT_STACKS: Record<CvFont, string> = {
  arial: `Arial, Helvetica, ${ARABIC_FACE}, sans-serif`,
  calibri: `Calibri, Carlito, Arial, ${ARABIC_FACE}, sans-serif`,
  plex: `var(--font-plex-sans), ${ARABIC_FACE}, system-ui, sans-serif`,
  georgia: `Georgia, ${ARABIC_FACE}, serif`,
  times: `"Times New Roman", Times, ${ARABIC_FACE}, serif`,
};

function Text({ nodes }: { nodes: Inline[] }) {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text": return <Fragment key={i}>{n.v}</Fragment>;
      case "br": return <br key={i} />;
      case "b": return <strong key={i}><Text nodes={n.c} /></strong>;
      case "i": return <em key={i}><Text nodes={n.c} /></em>;
      case "u": return <u key={i}><Text nodes={n.c} /></u>;
      case "link": return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow"><Text nodes={n.c} /></a>;
    }
  });
}

function ListBlock({ block }: { block: Extract<Block, { t: "list" }> }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag>
      {block.items.map((item, i) => (
        <li key={i} dir="auto"><Text nodes={item.c} />{item.sub && <ListBlock block={item.sub} />}</li>
      ))}
    </Tag>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case "section": return <h2 dir="auto"><Text nodes={block.c} /></h2>;
    case "subsection": return <h3 dir="auto"><Text nodes={block.c} /></h3>;
    case "p": return <p dir="auto"><Text nodes={block.c} /></p>;
    case "list": return <ListBlock block={block} />;
    case "pagebreak": return <div className="cv-pagebreak" aria-hidden />;
    case "skill": return <p dir="auto"><strong><Text nodes={block.label} />:</strong> <Text nodes={block.value} /></p>;
    case "entry":
      return (
        <div className="cv-entry">
          <p className="cv-entry-row"><strong><Text nodes={block.title} /></strong><span className="cv-date"><Text nodes={block.date} /></span></p>
          {(block.org.length > 0 || block.place.length > 0) && (
            <p className="cv-entry-row cv-org"><span><Text nodes={block.org} /></span><span><Text nodes={block.place} /></span></p>
          )}
        </div>
      );
  }
}

/** The CV itself: the same markup is used for the preview, the template cards and the PDF. */
export function CvDocument({ doc }: { doc: CvDocumentModel }) {
  return (
    <article className={`cv-doc cv-${doc.template} ${doc.font ? "cv-font-set" : ""}`} dir={doc.rtl ? "rtl" : "ltr"}
      style={{ "--cv-accent": doc.accent, ...(doc.font && { fontFamily: FONT_STACKS[doc.font] }) } as CSSProperties}>
      <header>
        <h1 dir="auto"><Text nodes={doc.name} /></h1>
        {doc.headline.length > 0 && <p className="cv-headline" dir="auto"><Text nodes={doc.headline} /></p>}
        {doc.contacts.length > 0 && (
          <p className="cv-contacts">{doc.contacts.map((c, i) => <bdi key={i}><Text nodes={c} /></bdi>)}</p>
        )}
        {doc.personal.length > 0 && (
          <p className="cv-personal">{doc.personal.map((row, i) => <bdi key={i}><strong><Text nodes={row.label} />:</strong> <Text nodes={row.value} /></bdi>)}</p>
        )}
      </header>
      {doc.template === "sidebar" && doc.side.length > 0 ? (
        // Main content comes first in the markup, so text extractors read it before the sidebar.
        <div className="cv-columns">
          <div className="cv-main">{doc.blocks.map((block, i) => <BlockView key={i} block={block} />)}</div>
          <aside className="cv-side">{doc.side.map((block, i) => <BlockView key={i} block={block} />)}</aside>
        </div>
      ) : (
        [...doc.blocks, ...doc.side].map((block, i) => <BlockView key={i} block={block} />)
      )}
    </article>
  );
}
