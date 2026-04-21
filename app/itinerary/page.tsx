"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import LZString from "lz-string";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Share2, Check, MapPin, Clock, Sparkles, Pencil, Send, X } from "lucide-react";
import type { Itinerary } from "@/types/itinerary";
import StopCard from "@/components/StopCard";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-stone-100 rounded-2xl animate-pulse flex items-center justify-center text-stone-400 text-sm">
      Loading map...
    </div>
  ),
});

function ItineraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [stops, setStops] = useState(itinerary?.stops ?? []);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Edit panel
  const [editOpen, setEditOpen] = useState(false);
  const [editRequest, setEditRequest] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Drag and drop
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const data = searchParams.get("data");
    if (!data) { setError("No itinerary data found."); return; }
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (!decompressed) throw new Error("decompression failed");
      const decoded = JSON.parse(decompressed);
      setItinerary(decoded);
      setStops(decoded.stops);
    } catch {
      setError("Could not load itinerary. The link may be corrupted.");
    }
  }, [searchParams]);

  const updateUrl = (updated: Itinerary) => {
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(updated));
    router.replace(`/itinerary?data=${encoded}`, { scroll: false });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    dragIndex.current = index;
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) {
      setDraggingIndex(null);
      return;
    }
    const newStops = [...stops];
    const [moved] = newStops.splice(dragIndex.current, 1);
    newStops.splice(dropIndex, 0, moved);
    setStops(newStops);
    dragIndex.current = null;
    setDraggingIndex(null);
    if (itinerary) {
      const updated = { ...itinerary, stops: newStops };
      setItinerary(updated);
      updateUrl(updated);
    }
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  // Edit itinerary
  const handleEdit = async () => {
    if (!editRequest.trim() || !itinerary) return;
    setIsEditing(true);
    setEditError("");
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary: { ...itinerary, stops }, request: editRequest }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update itinerary");
      }
      const updated: Itinerary = await res.json();
      setItinerary(updated);
      setStops(updated.stops);
      updateUrl(updated);
      setEditRequest("");
      setEditOpen(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsEditing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="text-orange-500 font-semibold hover:underline">
            Plan a new adventure →
          </button>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const geocodedStops = stops.filter((s) => s.lat && s.lng);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            New plan
          </button>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Day Adventure Planner
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(!editOpen)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition-all ${editOpen ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"}`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit plan
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors"
            >
              {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Share2 className="w-4 h-4" />Share</>}
            </button>
          </div>
        </div>

        {/* Edit panel */}
        {editOpen && (
          <div className="border-t border-stone-100 bg-white px-4 py-4">
            <div className="max-w-6xl mx-auto">
              <p className="text-sm text-stone-500 mb-2">What would you like to change?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editRequest}
                  onChange={(e) => setEditRequest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                  placeholder={`e.g. "Add a coffee shop after stop 2" or "Replace stop 4 with something different"`}
                  className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleEdit}
                  disabled={isEditing || !editRequest.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors"
                >
                  {isEditing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isEditing ? "Updating..." : "Update"}
                </button>
                <button onClick={() => setEditOpen(false)} className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {editError && <p className="text-red-500 text-xs mt-2">{editError}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title block */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-orange-500 text-sm font-semibold mb-2">
            <MapPin className="w-4 h-4" />
            {itinerary.neighborhood}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">{itinerary.title}</h1>
          <p className="text-stone-600 text-base max-w-xl leading-relaxed">{itinerary.summary}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-stone-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{itinerary.total_duration_hours} hours</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{stops.length} stops</span>
            <span className="text-stone-400 text-xs flex items-center gap-1">drag cards to reorder</span>
          </div>
        </div>

        {/* Mobile: map on top, itinerary scrolls below. Desktop: side by side. */}

        {/* Mobile map — full width, shown above itinerary */}
        <div className="md:hidden mb-6">
          {geocodedStops.length > 0 ? (
            <div className="h-[280px] rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              <MapView stops={stops} />
            </div>
          ) : (
            <div className="h-[200px] bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 text-sm">
              Map unavailable
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Stops list — always visible on mobile, scrolls naturally */}
          <div>
            <h2 className="text-lg font-bold text-stone-800 mb-6">Your itinerary</h2>
            <div onDragEnd={handleDragEnd}>
              {stops.map((stop, index) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  isLast={index === stops.length - 1}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  isDragging={draggingIndex === index}
                />
              ))}
            </div>
          </div>

          {/* Desktop map — sticky sidebar, hidden on mobile (shown above instead) */}
          <div className="hidden md:block md:sticky md:top-24">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Route map</h2>
            {geocodedStops.length > 0 ? (
              <div className="h-[600px] rounded-2xl overflow-hidden shadow-sm border border-stone-100">
                <MapView stops={stops} />
              </div>
            ) : (
              <div className="h-[300px] bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 text-sm">
                Map unavailable — addresses could not be geocoded
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {["restaurant", "cafe", "bar", "gallery", "park", "shop", "attraction"].map((type) => {
                const hasType = stops.some((s) => s.type === type);
                if (!hasType) return null;
                const emojis: Record<string, string> = {
                  restaurant: "🍽️", cafe: "☕", bar: "🍸",
                  gallery: "🎨", park: "🌿", shop: "🛍️", attraction: "⭐",
                };
                return (
                  <span key={type} className="text-xs bg-white border border-stone-100 rounded-full px-2.5 py-1 text-stone-600 shadow-sm">
                    {emojis[type]} {type}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center py-12 border-t border-stone-100">
          <p className="text-stone-500 text-sm mb-4">Want to try a different neighborhood?</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold px-8 py-3 rounded-2xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-orange-100 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Plan another adventure
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <ItineraryContent />
    </Suspense>
  );
}
