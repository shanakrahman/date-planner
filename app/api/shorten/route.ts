import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) throw new Error("TinyURL failed");
    const short = await res.text();
    if (!short.startsWith("https://")) throw new Error("Invalid response");

    return NextResponse.json({ short });
  } catch {
    return NextResponse.json({ error: "Could not shorten URL" }, { status: 500 });
  }
}
