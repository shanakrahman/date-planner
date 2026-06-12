import { redirect } from "next/navigation";
import LZString from "lz-string";

export default async function SharedItinerary({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let itinerary: unknown;
  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    itinerary = await res.json();
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
        <div className="text-center">
          <p className="text-stone-500 mb-4">This itinerary could not be found or has expired.</p>
          <a href="/" className="text-orange-500 font-semibold hover:underline">
            Plan a new adventure →
          </a>
        </div>
      </div>
    );
  }

  const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(itinerary));
  redirect(`/itinerary?data=${encoded}`);
}
