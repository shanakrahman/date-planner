import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Itinerary } from "@/types/itinerary";

const client = new Anthropic();

const isValidUSCoord = (lat: number, lng: number) =>
  lat >= 24 && lat <= 50 && lng >= -125 && lng <= -65;

export async function POST(req: NextRequest) {
  try {
    const { itinerary, request }: { itinerary: Itinerary; request: string } = await req.json();

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 3000,
      system: `You are an expert day-trip planner editing an existing itinerary. The user will provide a change request in plain English. Apply the change and return the COMPLETE updated itinerary as valid JSON only — no markdown, no explanation.

Keep all existing stops unless asked to change them. Preserve all existing fields. The JSON schema for each stop is:
{
  "id": "stop-N",
  "name": "venue name",
  "type": "restaurant | cafe | bar | gallery | park | shop | attraction | other",
  "address": "full street address",
  "arrival_time": "HH:MM AM/PM",
  "duration_minutes": number,
  "description": "what makes this place special",
  "must_try": "specific item or experience to order/do",
  "image_query": "2-4 word food photo search term",
  "tips": "insider tip",
  "lat": number,
  "lng": number
}`,
      messages: [{
        role: "user",
        content: `Here is the current itinerary:\n${JSON.stringify(itinerary, null, 2)}\n\nUser request: "${request}"\n\nReturn the full updated itinerary JSON.`,
      }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    let updated: Itinerary;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      updated = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response. Try again." }, { status: 500 });
    }

    // Geocode any new stops missing coordinates
    const geocoded = await Promise.all(
      updated.stops.map(async (stop) => {
        if (stop.lat && stop.lng && isValidUSCoord(stop.lat, stop.lng)) return stop;
        try {
          const query = encodeURIComponent(`${stop.name} ${stop.address}`);
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`,
            { headers: { "User-Agent": "DayAdventurePlanner/1.0" } }
          );
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            return { ...stop, lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
          }
        } catch { /* keep stop without coords */ }
        return stop;
      })
    );

    return NextResponse.json({ ...updated, stops: geocoded });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
