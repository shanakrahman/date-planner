import { Clock, MapPin, Lightbulb, Star, GripVertical } from "lucide-react";
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
  const colors = TYPE_COLORS[stop.type] || TYPE_COLORS.other;
  const emoji = TYPE_EMOJI[stop.type] || "📍";

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + " " + stop.address)}`;

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

        {stop.must_try && (
          <div className="bg-white rounded-xl mb-3 border border-orange-100 overflow-hidden">
            {stop.image_query && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://loremflickr.com/600/280/${stop.image_query.trim().replace(/\s+/g, ",")}`}
                alt={stop.must_try}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
            )}
            <div className="flex items-start gap-2 px-3 py-2.5">
              <Star className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5 fill-orange-400" />
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-0.5">Must try</p>
                <p className="text-sm text-stone-700 leading-relaxed">{stop.must_try}</p>
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

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-stone-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {stop.address}
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white border border-stone-200 hover:border-stone-400 text-stone-700 hover:text-stone-900 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="url(#maps-gradient)"/>
              <defs>
                <linearGradient id="maps-gradient" x1="5" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4285F4"/>
                  <stop offset="100%" stopColor="#34A853"/>
                </linearGradient>
              </defs>
            </svg>
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
