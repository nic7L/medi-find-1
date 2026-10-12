import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type FacilityRow = Tables<"facilities">;
export type Feedback = Tables<"feedback">;
export type Category = Tables<"categories">;
export type Facility = FacilityRow & { rating: number; reviewCount: number };

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  clinic: { label: "Clinic", emoji: "🩺" },
  lab: { label: "Lab", emoji: "🧪" },
  pharmacy: { label: "Pharmacy", emoji: "💊" },
  support: { label: "Support", emoji: "🤝" },
};

export function categoryLabel(slug: string, cats?: Category[]) {
  return cats?.find((c) => c.slug === slug)?.name ?? CATEGORY_META[slug]?.label ?? slug;
}

export const facilitiesQuery = queryOptions({
  queryKey: ["facilities"],
  queryFn: async (): Promise<Facility[]> => {
    const { data, error } = await supabase
      .from("facilities")
      .select("*, feedback(rating)")
      .order("name");
    if (error) throw error;
    return (data ?? []).map(({ feedback, ...f }) => {
      const ratings = (feedback ?? []).map((r) => r.rating);
      const rating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      return { ...f, rating, reviewCount: ratings.length };
    });
  },
  staleTime: 30_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export const feedbackQuery = (facilityId: string) =>
  queryOptions({
    queryKey: ["feedback", facilityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("facility_id", facilityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

function toMinutes(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

export function isOpenNow(f: Pick<FacilityRow, "is_24h" | "opening_time" | "closing_time">, now = new Date()) {
  if (f.is_24h) return true;
  const cur = now.getHours() * 60 + now.getMinutes();
  const o = toMinutes(f.opening_time);
  const c = toMinutes(f.closing_time);
  return o <= c ? cur >= o && cur < c : cur >= o || cur < c;
}

export function formatTime(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function hoursLabel(f: FacilityRow) {
  return f.is_24h ? "Open 24 hours" : `${formatTime(f.opening_time)} – ${formatTime(f.closing_time)}`;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number | null; lng: number | null }) {
  if (b.lat == null || b.lng == null) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function mapsUrl(f: FacilityRow) {
  const q = f.latitude && f.longitude ? `${f.latitude},${f.longitude}` : `${f.name} ${f.address} ${f.area}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
