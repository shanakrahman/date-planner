export interface MustTryItem {
  text: string;
  image: string;
}

export interface Stop {
  id: string;
  name: string;
  type: "restaurant" | "cafe" | "bar" | "gallery" | "park" | "shop" | "attraction" | "other";
  address: string;
  arrival_time: string;
  duration_minutes: number;
  description: string;
  tips: string;
  must_try: MustTryItem[];
  image_query?: string;
  lat?: number;
  lng?: number;
}

export interface Itinerary {
  title: string;
  neighborhood: string;
  date?: string;
  total_duration_hours: number;
  summary: string;
  stops: Stop[];
  generated_at: string;
}
