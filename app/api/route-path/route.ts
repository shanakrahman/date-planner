import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { waypoints }: { waypoints: [number, number][] } = await req.json();
    if (!waypoints || waypoints.length < 2) {
      return NextResponse.json({ error: "Need at least 2 waypoints" }, { status: 400 });
    }

    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`,
      {
        headers: { "User-Agent": "DayAdventurePlanner/1.0" },
        signal: AbortSignal.timeout(6000),
      }
    );

    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
      const path = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      return NextResponse.json({ path });
    }

    return NextResponse.json({ path: null });
  } catch {
    return NextResponse.json({ path: null });
  }
}
