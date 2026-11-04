import { ImageResponse } from "next/og";

export const alt = "TechGulf Jobs: IT jobs in the Gulf and India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0f766e", color: "#ffffff" }}>
      <div style={{ fontSize: 44, fontWeight: 700 }}>techgulf.jobs</div>
      <div style={{ fontSize: 76, fontWeight: 700, marginTop: 32, lineHeight: 1.1 }}>IT jobs in the Gulf and India</div>
      <div style={{ fontSize: 34, marginTop: 28, opacity: 0.9 }}>Direct from company career pages</div>
    </div>,
    size,
  );
}
