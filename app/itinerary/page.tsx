"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import LZString from "lz-string";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Share2, Check, MapPin, Clock, Sparkles, Pencil, Send, X, Link2, Image } from "lucide-react";
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

// ─── Canvas image generation (client-side, no server required) ───────────────

const STOP_COLORS: Record<string, string> = {
  restaurant: "#f97316", cafe: "#d97706", bar: "#9333ea",
  gallery: "#0284c7", park: "#16a34a", shop: "#db2777",
  attraction: "#ca8a04", other: "#78716c",
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildItineraryCanvas(itinerary: Itinerary, stops: Itinerary["stops"]): HTMLCanvasElement {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  // Background
  ctx.fillStyle = "#fff7ed"; ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = "#f97316"; ctx.fillRect(0, 0, W, 180);

  // Roam wordmark
  ctx.fillStyle = "white";
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  ctx.fillText("Roam", 60, 108);
  ctx.font = "500 30px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Day Adventure", 60, 154);

  // Duration badge (right side of header)
  const badge = `${itinerary.total_duration_hours ?? "?"}h · ${Math.min(stops.length, 4)} stops`;
  ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
  const btw = ctx.measureText(badge).width;
  const bx = W - btw - 100, by = 66, bw = btw + 40, bh = 48;
  ctx.fillStyle = "rgba(255,255,255,0.22)"; rrect(ctx, bx, by, bw, bh, 24); ctx.fill();
  ctx.fillStyle = "white"; ctx.fillText(badge, bx + 20, by + 32);

  // Neighborhood
  let y = 228;
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
  ctx.fillText(`📍 ${(itinerary.neighborhood ?? "").toUpperCase()}`, 60, y);
  y += 56;

  // Title
  ctx.fillStyle = "#1c1917";
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  for (const line of wrapText(ctx, itinerary.title ?? "", W - 120).slice(0, 2)) {
    ctx.fillText(line, 60, y); y += 76;
  }
  y += 8;

  // Summary
  if (itinerary.summary) {
    ctx.fillStyle = "#78716c";
    ctx.font = "26px system-ui, -apple-system, sans-serif";
    for (const line of wrapText(ctx, itinerary.summary, W - 120).slice(0, 2)) {
      ctx.fillText(line, 60, y); y += 38;
    }
    y += 6;
  }

  // Divider
  y += 18;
  ctx.strokeStyle = "#e7e5e4"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
  y += 26;

  // Stop cards
  const cardH = 112;
  for (let i = 0; i < stops.slice(0, 4).length; i++) {
    const stop = stops[i];
    const color = STOP_COLORS[stop.type] ?? STOP_COLORS.other;

    // Card background + border
    ctx.fillStyle = "white"; rrect(ctx, 60, y, W - 120, cardH, 20); ctx.fill();
    ctx.strokeStyle = "#e7e5e4"; ctx.lineWidth = 2;
    rrect(ctx, 60, y, W - 120, cardH, 20); ctx.stroke();

    // Numbered circle
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(116, y + cardH / 2, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white"; ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.fillText(String(i + 1), 116, y + cardH / 2 + 9);
    ctx.textAlign = "left";

    // Stop name
    ctx.fillStyle = "#1c1917"; ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
    const name = stop.name.length > 36 ? stop.name.slice(0, 36) + "…" : stop.name;
    ctx.fillText(name, 168, y + 46);

    // Time + duration
    ctx.fillStyle = "#a8a29e"; ctx.font = "22px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${stop.arrival_time} · ${stop.duration_minutes} min`, 168, y + 84);

    y += cardH + 16;
  }

  // Footer
  ctx.fillStyle = "#d6d3d1"; ctx.font = "20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("date-planner-roan.vercel.app · Plan your own adventure", W / 2, H - 36);

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────

function ItineraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [stops, setStops] = useState(itinerary?.stops ?? []);
  const [error, setError] = useState("");
  // Share panel
  const [shareOpen, setShareOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Close share panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    if (shareOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [shareOpen]);

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
      let json: string | null = LZString.decompressFromEncodedURIComponent(data);
      let wasLegacy = false;
      if (!json) {
        // Fall back to old base64 format for previously shared links
        const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "==".slice(0, (4 - (normalized.length % 4)) % 4);
        json = decodeURIComponent(atob(padded));
        wasLegacy = true;
      }
      const decoded = JSON.parse(json);
      setItinerary(decoded);
      setStops(decoded.stops);
      // Silently upgrade legacy URLs to compressed format
      if (wasLegacy) {
        const encoded = LZString.compressToEncodedURIComponent(json);
        router.replace(`/itinerary?data=${encoded}`, { scroll: false });
      }
    } catch {
      setError("Could not load itinerary. The link may be corrupted.");
    }
  }, [searchParams]);

  const updateUrl = (updated: Itinerary) => {
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(updated));
    router.replace(`/itinerary?data=${encoded}`, { scroll: false });
  };

  const handleOpenShare = async () => {
    setShareOpen(true);

    // Generate preview immediately using canvas (no server needed)
    if (itinerary && !previewDataUrl) {
      const canvas = buildItineraryCanvas(itinerary, stops);
      setPreviewDataUrl(canvas.toDataURL("image/png"));
    }

    if (shareId) return; // already saved this session
    setIsPreparingShare(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...itinerary, stops }),
      });
      const data = await res.json();
      if (data.id) setShareId(data.id);
    } catch { /* non-critical — share link just won't work */ }
    finally { setIsPreparingShare(false); }
  };

  const handleCopyLink = async () => {
    if (!shareId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/i/${shareId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleCopyImage = async () => {
    if (!itinerary) return;
    setIsCopyingImage(true);
    try {
      // Build canvas synchronously so we can hand the blob Promise to ClipboardItem
      // before any await — this preserves the browser's gesture context for clipboard access.
      const canvas = buildItineraryCanvas(itinerary, stops);
      const blobPromise = new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
      );

      const isTouch = navigator.maxTouchPoints > 1;
      if (isTouch && typeof navigator.share === "function") {
        // Mobile: native share sheet (image only — no URL so it shows as an actual image)
        const blob = await blobPromise;
        const file = new File([blob], "roam-itinerary.png", { type: "image/png" });
        await navigator.share({ files: [file], title: itinerary.title ?? "Roam itinerary" });
      } else {
        // Desktop: try clipboard first, fall back to download
        let copied = false;
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
          try {
            // Pass the Promise directly — ClipboardItem is created synchronously
            // within the click gesture so the browser grants clipboard permission.
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
            copied = true;
          } catch (e) {
            console.warn("Clipboard write failed, downloading instead:", e);
          }
        }
        if (!copied) {
          const blob = await blobPromise;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "roam-itinerary.png"; a.click();
          URL.revokeObjectURL(url);
        }
      }
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2500);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error(err);
        setImageFailed(true);
        setTimeout(() => setImageFailed(false), 3000);
      }
    } finally {
      setIsCopyingImage(false);
    }
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

            {/* Share button + popover */}
            <div className="relative" ref={shareRef}>
              <button
                onClick={handleOpenShare}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              {shareOpen && (
                <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 w-72 z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-stone-800">Share itinerary</span>
                    <button onClick={() => setShareOpen(false)} className="text-stone-400 hover:text-stone-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image preview — rendered client-side from canvas */}
                  <div className="rounded-xl overflow-hidden mb-3 bg-stone-100 border border-stone-100" style={{ aspectRatio: "4/5" }}>
                    {previewDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewDataUrl} alt="Itinerary preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyLink}
                      disabled={!shareId}
                      className="flex items-center gap-2 w-full bg-stone-50 hover:bg-stone-100 disabled:opacity-50 text-stone-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                      {linkCopied ? "Link copied!" : "Copy link"}
                    </button>
                    <button
                      onClick={handleCopyImage}
                      disabled={!shareId || isCopyingImage}
                      className="flex items-center gap-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      {isCopyingImage
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                        : imageCopied
                        ? <><Check className="w-4 h-4" />Image copied!</>
                        : imageFailed
                        ? <>Try again — image failed</>
                        : <><Image className="w-4 h-4" />Copy image</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
