import { ImageResponse } from "@vercel/og";
import type { Route } from "./+types/api.og-image";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "TCE Preview";
  const grade = url.searchParams.get("grade") || "";
  const book = url.searchParams.get("book") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            TCE Preview
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? "36px" : "48px",
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: "28px",
            maxWidth: "900px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </div>

        {/* Grade & Book info */}
        {(grade || book) && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {grade && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "24px",
                  padding: "10px 20px",
                  fontSize: "22px",
                  fontWeight: 500,
                }}
              >
                Grade {grade}
              </div>
            )}
            {book && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "24px",
                  padding: "10px 20px",
                  fontSize: "20px",
                  fontWeight: 400,
                  maxWidth: "700px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {book}
              </div>
            )}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    },
  );
}
