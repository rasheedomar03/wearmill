import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wearmill — Custom Printed Products for Your Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const playfairFont = await fetch(
    "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.woff"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#070709",
          gap: 24,
        }}
      >
        {/* WM lettermark */}
        <div
          style={{
            fontSize: 160,
            fontWeight: 700,
            color: "#E4B84D",
            letterSpacing: "-0.02em",
            fontFamily: "Playfair Display",
            lineHeight: 1,
          }}
        >
          WM
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "rgba(240,240,245,0.45)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "Playfair Display",
          }}
        >
          Wearmill
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Playfair Display",
          data: playfairFont,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
