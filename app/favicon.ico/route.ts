import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const playfairFont = await fetch(
    "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.woff"
  ).then((res) => res.arrayBuffer());

  const response = new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070709",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#E4B84D",
            letterSpacing: "-0.02em",
            fontFamily: "Playfair Display",
            lineHeight: 1,
          }}
        >
          WM
        </div>
      </div>
    ),
    {
      width: 32,
      height: 32,
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

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
