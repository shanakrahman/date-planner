import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const body = new URLSearchParams({ url });
    const res = await fetch("https://cleanuri.com/api/v1/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error("URL shortening failed");
    const data = await res.json() as { result_url?: string };
    if (!data.result_url) throw new Error("Invalid response");

    return NextResponse.json({ short: data.result_url });
  } catch {
    return NextResponse.json({ error: "Could not shorten URL" }, { status: 500 });
  }
}
