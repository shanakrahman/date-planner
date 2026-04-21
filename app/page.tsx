"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Sparkles, Clock, UtensilsCrossed, Palette, Music, ChevronDown } from "lucide-react";

const INTEREST_OPTIONS = [
  { id: "food", label: "Food & Dining", icon: "🍜" },
  { id: "art", label: "Art & Culture", icon: "🎨" },
  { id: "coffee", label: "Cafes & Coffee", icon: "☕" },
  { id: "bars", label: "Bars & Cocktails", icon: "🍸" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "nature", label: "Parks & Nature", icon: "🌿" },
  { id: "history", label: "History & Architecture", icon: "🏛️" },
  { id: "nightlife", label: "Nightlife", icon: "🌙" },
];

const DURATION_OPTIONS = [
  { value: "2", label: "2 hours" },
  { value: "4", label: "Half day (4 hrs)" },
  { value: "6", label: "6 hours" },
  { value: "8", label: "Full day (8 hrs)" },
];

export default function Home() {
  const router = useRouter();
  const [freeText, setFreeText] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("4");
  const [interests, setInterests] = useState<string[]>([]);
  const [dietary, setDietary] = useState("");
  const [budget, setBudget] = useState("moderate");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() && !freeText.trim()) {
      setError("Please tell us where you want to go or describe your ideal day.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeText,
          location,
          duration: parseInt(duration),
          interests,
          dietary,
          budget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate itinerary");
      }

      const itinerary = await res.json();
      const encoded = btoa(encodeURIComponent(JSON.stringify(itinerary))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      router.push(`/itinerary?data=${encoded}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-rose-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Day Planning
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Your Perfect Day,<br />Planned in Seconds
          </h1>
          <p className="text-lg md:text-xl text-orange-100 max-w-2xl mx-auto mb-8">
            Tell us where you want to go and what you love. Claude AI builds you an optimized, shareable itinerary — restaurants, galleries, bars, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-orange-100">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Geo-optimized routes</span>
            <span className="flex items-center gap-1.5"><UtensilsCrossed className="w-4 h-4" /> Dietary-aware</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Timed itinerary</span>
            <span className="flex items-center gap-1.5"><Palette className="w-4 h-4" /> Shareable link</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-stone-50" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Free text input */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Describe your ideal day <span className="text-stone-400 font-normal">(optional but powerful)</span>
            </label>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder={`Tell us anything — paste a social media post about spots you saw, drop links to places you want to visit, or just describe the vibe:\n\n"Saw this ramen spot on TikTok, want to explore Chinatown, love cocktail bars, maybe some art galleries..."`}
              rows={4}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none text-sm shadow-sm"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Neighborhood or city <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chinatown NYC, Williamsburg Brooklyn, SoHo..."
                className="w-full rounded-2xl border border-stone-200 bg-white pl-10 pr-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              How long do you have?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`rounded-xl py-2.5 text-sm font-medium border transition-all ${
                    duration === opt.value
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200"
                      : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              What are you into? <span className="text-stone-400 font-normal">(pick all that apply)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INTEREST_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInterest(opt.id)}
                  className={`rounded-xl py-2.5 px-3 text-sm font-medium border transition-all text-left flex items-center gap-2 ${
                    interests.includes(opt.id)
                      ? "bg-orange-50 text-orange-700 border-orange-400 shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary & Budget row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Dietary needs
              </label>
              <input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="e.g. vegetarian, gluten-free..."
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Budget
              </label>
              <div className="relative">
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm text-sm pr-8"
                >
                  <option value="budget">Budget ($)</option>
                  <option value="moderate">Moderate ($$)</option>
                  <option value="upscale">Upscale ($$$)</option>
                  <option value="luxury">Luxury ($$$$)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold py-4 rounded-2xl text-base hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Planning your adventure...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Plan My Day
              </>
            )}
          </button>
        </form>

        {/* How it works */}
        <div className="mt-16 text-center">
          <p className="text-stone-400 text-sm font-medium uppercase tracking-wider mb-8">How it works</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: "✍️", title: "Tell us your vibe", desc: "Share preferences, paste links, or describe your dream day" },
              { icon: "🤖", title: "AI builds your plan", desc: "Claude curates venues, optimizes your route and timing" },
              { icon: "🗺️", title: "Explore & share", desc: "Get an interactive map + shareable link to send friends" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="text-3xl mb-1">{step.icon}</div>
                <p className="font-semibold text-stone-800 text-sm">{step.title}</p>
                <p className="text-stone-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
