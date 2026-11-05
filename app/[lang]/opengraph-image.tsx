import { ImageResponse } from "next/og";

export const alt = "TechGulf Jobs: tech jobs in the Gulf and India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLACES = ["UAE", "Saudi Arabia", "Qatar", "Kuwait", "India"];

// Link previews are often shown small, so the text is kept short and large.
export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0f172a", color: "#ffffff", position: "relative" }}>
      <div style={{ position: "absolute", display: "flex", top: -300, right: -240, width: 620, height: 620, borderRadius: 620, background: "#0f766e" }} />
      <div style={{ position: "absolute", display: "flex", top: 215, right: 90, width: 90, height: 90, borderRadius: 90, background: "#2dd4bf" }} />

      <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 700 }}>
        techgulf<span style={{ color: "#2dd4bf", margin: "0 -2px" }}>.</span>jobs
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
          <span>Tech jobs in the</span>
          <span>Gulf &amp; India</span>
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 24, color: "#cbd5e1" }}>Direct from company career pages</div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        {PLACES.map((p) => (
          <div key={p} style={{ display: "flex", padding: "12px 26px", borderRadius: 999, fontSize: 30, border: "2px solid #475569", color: "#f1f5f9" }}>{p}</div>
        ))}
      </div>
    </div>,
    size,
  );
}
