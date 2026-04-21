import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Itinerary } from "@/types/itinerary";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert local guide and day-trip planner. When given user preferences, you generate highly specific, realistic, and optimized day itineraries.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. The JSON must match this exact schema:

{
  "title": "string — evocative title for this adventure",
  "neighborhood": "string — the neighborhood/area name",
  "total_duration_hours": number,
  "summary": "string — 1-2 sentence overview of the day",
  "stops": [
    {
      "id": "string — unique slug like 'stop-1'",
      "name": "string — exact real venue name",
      "type": "restaurant | cafe | bar | gallery | park | shop | attraction | other",
      "address": "string — full street address including city and zip",
      "arrival_time": "string — e.g. '10:00 AM'",
      "duration_minutes": number,
      "description": "string — what this place is and why it's special",
      "must_try": "[{\"text\": \"string\", \"image\": \"string\"}] — For restaurants/bars: 3 items with specific 2-4 word image queries (e.g. {\"text\": \"The egg tarts — flaky pastry shell with silky custard\", \"image\": \"chinese egg tarts\"}). For cafes/galleries/parks: 1 item.",
      "tips": "string — insider tip for visiting",
      "lat": number — precise latitude coordinate for this exact venue,
      "lng": number — precise longitude coordinate for this exact venue
    }
  ],
  "generated_at": "string — ISO 8601 timestamp"
}

Rules:
- Use REAL, currently operating venues with accurate addresses
- 4-8 stops for a typical day (fewer for short durations)
- Optimize the order geographically to minimize walking
- Respect dietary restrictions strictly — if user is vegetarian, every food stop must be vegetarian-friendly
- Match the budget level across all food/drink stops
- Include a mix of venue types matching user interests
- arrival_time should be realistic and sequential, starting from a reasonable morning or afternoon time
- duration_minutes should be realistic (e.g., 60-90 for a meal, 30-45 for coffee, 60-120 for a museum)
- Tips should be specific and useful (reservation needed? cash only? best seat in the house?)`;

export async function POST(req: NextRequest) {
  try {
    const { freeText, location, duration, interests, dietary, budget } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const userPrompt = `Plan a ${duration}-hour day adventure for me.

Location: ${location || "Not specified — use a popular urban neighborhood"}
${freeText ? `\nIMPORTANT — The user has shared specific venues, links, or posts they want to visit. You MUST include as many of these exact venues as possible in the itinerary. These are the user's top priority — do not replace them with similar alternatives. Only add extra stops from your own knowledge if there is remaining time to fill.\n\nUser's specific input:\n${freeText}` : ""}
${interests.length > 0 ? `\nAdditional interests: ${interests.join(", ")}` : ""}
${dietary ? `\nDietary restrictions: ${dietary}` : ""}
Budget level: ${budget}

Generate a realistic, geo-optimized itinerary. Any venues explicitly mentioned by the user must appear in the stops list.`;

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    let itinerary: Itinerary;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      itinerary = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude response:", rawText);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate coords are within the continental US; fall back to Nominatim if missing or wrong
    const isValidUSCoord = (lat: number, lng: number) =>
      lat >= 24 && lat <= 50 && lng >= -125 && lng <= -65;

    const geocoded = await Promise.all(
      itinerary.stops.map(async (stop) => {
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
        } catch {
          // Geocoding failed for this stop — return without coords
        }
        return stop;
      })
    );

    return NextResponse.json({ ...itinerary, stops: geocoded });
  } catch (err: unknown) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
