import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const itinerary = await req.json();

    const res = await fetch("https://jsonblob.com/api/jsonBlob", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(itinerary),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error("Failed to save");

    // Location is like: /api/jsonBlob/019eb9b5-2cbe-7fc0-9f58-e7c59e399ec0
    const location = res.headers.get("location");
    if (!location) throw new Error("No location returned");

    const id = location.split("/").pop();
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Could not save itinerary" }, { status: 500 });
  }
}
