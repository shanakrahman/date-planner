import { Clock, MapPin, Lightbulb, Star, GripVertical, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { useState } from "react";
import type { Stop } from "@/types/itinerary";

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  restaurant: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  cafe: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  bar: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  gallery: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  park: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  shop: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" },
  attraction: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  other: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
};

const TYPE_EMOJI: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍸",
  gallery: "🎨",
  park: "🌿",
  shop: "🛍️",
  attraction: "⭐",
  other: "📍",
};

interface StopCardProps {
  stop: Stop;
  index: number;
  isLast: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  isDragging?: boolean;
}

export default function StopCard({ stop, index, isLast, onDragStart, onDragOver, onDrop, isDragging }: StopCardProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const colors = TYPE_COLORS[stop.type] || TYPE_COLORS.other;
  const emoji = TYPE_EMOJI[stop.type] || "📍";

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + " " + stop.address)}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.name + " " + stop.address)}&travelmode=walking`;

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev === 0 ? stop.must_try.length - 1 : prev - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev === stop.must_try.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className={`flex gap-4 transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${colors.dot} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
          {index + 1}
        </div>
        {!isLast && <div className="w-0.5 bg-stone-200 flex-1 mt-2 mb-0 min-h-6" />}
      </div>

      {/* Card */}
      <div className={`flex-1 ${colors.bg} rounded-2xl p-5 mb-4 relative`}>
        <div className="absolute top-3 right-3 cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{emoji}</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                {stop.type}
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-lg leading-tight">{stop.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
            <span className="text-sm font-semibold text-stone-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {stop.arrival_time}
            </span>
            <span className="text-xs text-stone-500">{stop.duration_minutes} min</span>
          </div>
        </div>

        <p className="text-stone-700 text-sm leading-relaxed mb-3">{stop.description}</p>

        {stop.must_try && stop.must_try.length > 0 && (
          <div className="bg-white rounded-xl mb-3 border border-orange-100 overflow-hidden">
            {/* Carousel */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://loremflickr.com/600/280/${stop.must_try[carouselIndex].image.trim().replace(/\s+/g, ",")}`}
                alt={stop.must_try[carouselIndex].text}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              {/* Carousel controls */}
              {stop.must_try.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <button
                    onClick={handlePrevCarousel}
                    className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextCarousel}
                    className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              {/* Indicator dots */}
              {stop.must_try.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {stop.must_try.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === carouselIndex ? "bg-white w-6" : "bg-white/50"
                      }`}
                      aria-label={`Go to item ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex items-start gap-2 px-3 py-2.5">
              <Star className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5 fill-orange-400" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Must try</p>
                <p className="text-sm text-stone-700 leading-relaxed">{stop.must_try[carouselIndex].text}</p>
                {stop.must_try.length > 1 && (
                  <p className="text-xs text-stone-400 mt-1.5">{carouselIndex + 1} of {stop.must_try.length}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {stop.tips && (
          <div className="flex items-start gap-2 bg-white/60 rounded-xl px-3 py-2.5 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-stone-600 leading-relaxed">{stop.tips}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white border border-stone-200 hover:border-stone-400 text-blue-600 hover:text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            Directions
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white border border-stone-200 hover:border-stone-400 text-blue-600 hover:text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
