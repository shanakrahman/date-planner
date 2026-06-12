import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

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
      description?: string;
    }>;
  };

  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${id}`);
    if (!res.ok) throw new Error("Not found");
    itinerary = await res.json();
  } catch {
    return new Response("Itinerary not found", { status: 404 });
  }

  const stops = (itinerary.stops ?? []).slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(160deg, #fff7ed 0%, #fef9f0 60%, #fdf4e7 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
            padding: "36px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                fontSize: "42px",
                fontWeight: "900",
                color: "white",
                letterSpacing: "-1.5px",
              }}
            >
              Roam
            </div>
            <div
              style={{
                width: "1px",
                height: "32px",
                backgroundColor: "rgba(255,255,255,0.4)",
              }}
            />
            <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
              Day Adventure
            </div>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              fontSize: "18px",
              fontWeight: "600",
              padding: "8px 20px",
              borderRadius: "100px",
            }}
          >
            {itinerary.total_duration_hours}h · {stops.length} stops
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", padding: "44px 56px 32px" }}>
          <div
            style={{
              fontSize: "18px",
              color: "#f97316",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "3px",
              marginBottom: "14px",
            }}
          >
            📍 {itinerary.neighborhood}
          </div>
          <div
            style={{
              fontSize: "54px",
              fontWeight: "900",
              color: "#1c1917",
              lineHeight: "1.05",
              letterSpacing: "-1.5px",
              marginBottom: "16px",
            }}
          >
            {itinerary.title}
          </div>
          {itinerary.summary && (
            <div
              style={{
                fontSize: "20px",
                color: "#78716c",
                lineHeight: "1.5",
                maxWidth: "880px",
              }}
            >
              {itinerary.summary.length > 120
                ? itinerary.summary.slice(0, 120) + "…"
                : itinerary.summary}
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#e7e5e4",
            margin: "0 56px 32px",
          }}
        />

        {/* Stops */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 56px",
            gap: "16px",
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
                  gap: "24px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                {/* Number bubble */}
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: "800",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>

                {/* Stop info */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: "800",
                      color: "#1c1917",
                      marginBottom: "4px",
                    }}
                  >
                    {emoji} {stop.name}
                  </div>
                  <div style={{ fontSize: "17px", color: "#a8a29e", fontWeight: "500" }}>
                    {stop.arrival_time} · {stop.duration_minutes} min
                    {stop.description
                      ? " · " +
                        (stop.description.length > 60
                          ? stop.description.slice(0, 60) + "…"
                          : stop.description)
                      : ""}
                  </div>
                </div>

                {/* Time badge */}
                <div
                  style={{
                    backgroundColor: `${color}18`,
                    color: color,
                    fontSize: "16px",
                    fontWeight: "700",
                    padding: "6px 14px",
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
            fontWeight: "500",
            letterSpacing: "0.5px",
          }}
        >
          date-planner-roan.vercel.app · Plan your own adventure
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
