import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const res = await fetch(
      `https://is.gd/?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) throw new Error("URL shortening failed");
    const data = await res.json() as { shorturl?: string };
    if (!data.shorturl) throw new Error("Invalid response");

    return NextResponse.json({ short: data.shorturl });
  } catch {
    return NextResponse.json({ error: "Could not shorten URL" }, { status: 500 });
  }
}
