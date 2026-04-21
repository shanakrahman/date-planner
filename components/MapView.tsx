"use client";

import { useEffect, useRef } from "react";
import type { Stop } from "@/types/itinerary";

const TYPE_COLORS: Record<string, string> = {
  restaurant: "#f97316",
  cafe: "#92400e",
  bar: "#7c3aed",
  gallery: "#0ea5e9",
  park: "#22c55e",
  shop: "#ec4899",
  attraction: "#eab308",
  other: "#6b7280",
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

interface MapViewProps {
  stops: Stop[];
}

async function fetchWalkingRoute(waypoints: [number, number][]): Promise<[number, number][] | null> {
  try {
    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    }
  } catch {
    // OSRM unavailable — fall back to straight lines
  }
  return null;
}

export default function MapView({ stops }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const geocodedStops = stops.filter((s) => s.lat && s.lng);
    if (geocodedStops.length === 0) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
      }

      const avgLat = geocodedStops.reduce((s, stop) => s + stop.lat!, 0) / geocodedStops.length;
      const avgLng = geocodedStops.reduce((s, stop) => s + stop.lng!, 0) / geocodedStops.length;

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.setView([avgLat, avgLng], 15);

      // Try to get real walking route from OSRM
      if (geocodedStops.length > 1) {
        const waypoints = geocodedStops.map((s) => [s.lat!, s.lng!] as [number, number]);

        // Draw fallback dashed line immediately so map isn't blank while fetching
        const fallbackLine = L.polyline(waypoints, {
          color: "#f97316",
          weight: 3,
          opacity: 0.5,
          dashArray: "4 8",
        }).addTo(map);

        // Fetch walking route and replace fallback if successful
        fetchWalkingRoute(waypoints).then((walkingRoute) => {
          // Bail out if this specific map instance was already destroyed
          if (mapInstanceRef.current !== map) return;
          if (walkingRoute) {
            try {
              fallbackLine.remove();
              L.polyline(walkingRoute, {
                color: "#f97316",
                weight: 3,
                opacity: 0.55,
              }).addTo(map);
            } catch {
              // Map was removed between the check and the addTo call — safe to ignore
            }
          }
        });
      }

      // Add numbered markers
      geocodedStops.forEach((stop, index) => {
        const color = TYPE_COLORS[stop.type] || "#6b7280";
        const emoji = TYPE_EMOJI[stop.type] || "📍";

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${color};
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
            ">
              <span style="transform: rotate(45deg); display: block; line-height: 1;">${index + 1}</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        L.marker([stop.lat!, stop.lng!], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 180px; font-family: system-ui, sans-serif;">
              <div style="font-size: 18px; margin-bottom: 4px;">${emoji}</div>
              <strong style="font-size: 14px;">${stop.name}</strong>
              <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">${stop.arrival_time} · ${stop.duration_minutes} min</div>
              <div style="color: #374151; font-size: 12px; margin-top: 6px; line-height: 1.4;">${stop.description}</div>
            </div>
          `, { maxWidth: 240 });
      });

      // Fit bounds
      if (geocodedStops.length > 1) {
        const bounds = L.latLngBounds(geocodedStops.map((s) => [s.lat!, s.lng!]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stops]);

  const geocodedCount = stops.filter((s) => s.lat && s.lng).length;

  if (geocodedCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-2xl text-stone-500 text-sm">
        Map unavailable — venue addresses could not be geocoded
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {geocodedCount < stops.length && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-xs text-stone-500 px-3 py-1.5 rounded-full shadow-sm">
          {stops.length - geocodedCount} stop{stops.length - geocodedCount > 1 ? "s" : ""} not mapped
        </div>
      )}
    </div>
  );
}
