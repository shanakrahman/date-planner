import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Default Node.js runtime — next/og works on both runtimes

const TYPE_COLOR: Record<string, string> = {
  restaurant: "#f97316",
  cafe: "#d97706",
  bar: "#9333ea",
  gallery: "#0284c7",
  park: "#16a34a",
  shop: "#db2777",
  attraction: "#ca8a04",
  other: "#78716c",
};

const TYPE_EMOJI: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍸",
  gallery: "🎨",
  park: "🌿",
  shop: "🛍️",
  attraction: "⭐",
  other: "📍",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  let itinerary: {
    title?: string;
    neighborhood?: string;
    summary?: string;
    total_duration_hours?: number;
    stops?: Array<{
      name: string;
      type: string;
      arrival_time: string;
      duration_minutes: number;
    }>;
  };

  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${id}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`jsonblob ${res.status}`);
    itinerary = await res.json();
  } catch (e) {
    console.error("[og] fetch error:", e);
    return new Response("Itinerary not found", { status: 404 });
  }

  const stops = (itinerary.stops ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#fff7ed",
        }}
      >
        {/* Header — flat color, no gradient (Satori limitation) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f97316",
            padding: "40px 60px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "52px",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-2px",
              }}
            >
              Roam
            </div>
            <div style={{ fontSize: "20px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              Day Adventure
            </div>
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(255,255,255,0.22)",
              color: "white",
              fontSize: "20px",
              fontWeight: 700,
              padding: "10px 24px",
              borderRadius: "100px",
            }}
          >
            {itinerary.total_duration_hours}h · {stops.length} stops
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "44px 60px 28px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              color: "#f97316",
              fontWeight: 700,
              letterSpacing: "2px",
              marginBottom: "14px",
            }}
          >
            📍 {itinerary.neighborhood?.toUpperCase() ?? ""}
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              color: "#1c1917",
              lineHeight: 1.0,
              letterSpacing: "-2px",
              marginBottom: "18px",
            }}
          >
            {itinerary.title ?? ""}
          </div>
          {itinerary.summary && (
            <div
              style={{
                fontSize: "22px",
                color: "#78716c",
                lineHeight: 1.5,
              }}
            >
              {itinerary.summary.length > 110
                ? itinerary.summary.slice(0, 110) + "…"
                : itinerary.summary}
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            height: "1px",
            backgroundColor: "#e7e5e4",
            margin: "0 60px 28px",
          }}
        />

        {/* Stops */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 60px",
            flex: 1,
          }}
        >
          {stops.map((stop, i) => {
            const color = TYPE_COLOR[stop.type] ?? TYPE_COLOR.other;
            const emoji = TYPE_EMOJI[stop.type] ?? "📍";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: "20px",
                  padding: "22px 28px",
                  marginBottom: "14px",
                  border: "1.5px solid #e7e5e4",
                }}
              >
                {/* Number bubble */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    color: "white",
                    fontSize: "22px",
                    fontWeight: 800,
                    flexShrink: 0,
                    marginRight: "22px",
                  }}
                >
                  {i + 1}
                </div>

                {/* Info */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: "#1c1917",
                      marginBottom: "4px",
                    }}
                  >
                    {emoji} {stop.name}
                  </div>
                  <div style={{ fontSize: "17px", color: "#a8a29e", fontWeight: 500 }}>
                    {stop.arrival_time} · {stop.duration_minutes} min
                  </div>
                </div>

                {/* Type badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: color + "22",
                    color: color,
                    fontSize: "16px",
                    fontWeight: 700,
                    padding: "6px 16px",
                    borderRadius: "100px",
                    flexShrink: 0,
                  }}
                >
                  {stop.type}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px",
            color: "#d6d3d1",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          date-planner-roan.vercel.app · Plan your own adventure
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
