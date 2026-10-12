import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { LayoutGrid, List, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { FacilityCard, FacilityCardSkeleton } from "@/components/FacilityCard";
import { categoriesQuery, distanceKm, facilitiesQuery, isOpenNow } from "@/lib/facilities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const searchSchema = z.object({ q: z.string().optional(), category: z.string().optional() });

export const Route = createFileRoute("/directory")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Directory — MediFind" },
      { name: "description", content: "Search and filter clinics, labs, pharmacies and support facilities." },
      { property: "og:title", content: "Health Facility Directory — MediFind" },
      { property: "og:description", content: "Filter by category, area, open now, verification and rating." },
    ],
  }),
  component: Directory,
});

const chip = (on: boolean) =>
  cn("rounded-full border px-3 py-1.5 text-sm transition-all", on ? "bg-gradient-brand border-transparent text-primary-foreground" : "text-muted-foreground hover:text-foreground");

function Directory() {
  const search = Route.useSearch();
  const { data = [], isLoading } = useQuery(facilitiesQuery);
  const { data: cats = [] } = useQuery(categoriesQuery);
  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState(search.category ?? "");
  const [area, setArea] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [verified, setVerified] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<"rating" | "name" | "nearest">("rating");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);

  const areas = useMemo(() => Array.from(new Set(data.map((f) => f.area))).sort(), [data]);

  const results = useMemo(() => {
    const s = q.toLowerCase().trim();
    const list = data.filter(
      (f) =>
        (!s || f.name.toLowerCase().includes(s) || f.services.some((x) => x.toLowerCase().includes(s)) || f.area.toLowerCase().includes(s)) &&
        (!cat || f.category === cat) &&
        (!area || f.area === area) &&
        (!openNow || isOpenNow(f)) &&
        (!verified || f.verified) &&
        f.rating >= minRating,
    );
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "nearest" && loc) list.sort((a, b) => distanceKm(loc, { lat: a.latitude, lng: a.longitude }) - distanceKm(loc, { lat: b.latitude, lng: b.longitude }));
    else list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [data, q, cat, area, openNow, verified, minRating, sort, loc]);

  const pickSort = (v: string) => {
    if (v === "nearest" && !loc) {
      navigator.geolocation?.getCurrentPosition(
        (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setSort("nearest"); },
        () => toast.error("Location permission is needed to sort by nearest"),
      );
      return;
    }
    setSort(v as typeof sort);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-bold">Facility <span className="text-gradient">directory</span></h1>
      <div className="glass mt-6 space-y-4 rounded-3xl p-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, service or area…" aria-label="Search" className="w-full rounded-full bg-muted px-5 py-3 outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex flex-wrap gap-2">
          <button className={chip(!cat)} onClick={() => setCat("")}>All</button>
          {cats.map((c) => <button key={c.id} className={chip(cat === c.slug)} onClick={() => setCat(c.slug)}>{c.name}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area" className="rounded-full border bg-background px-3 py-1.5 text-sm">
            <option value="">All areas</option>
            {areas.map((a) => <option key={a}>{a}</option>)}
          </select>
          <button className={chip(openNow)} onClick={() => setOpenNow(!openNow)}>Open now</button>
          <button className={chip(verified)} onClick={() => setVerified(!verified)}>Verified only</button>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} aria-label="Minimum rating" className="rounded-full border bg-background px-3 py-1.5 text-sm">
            <option value={0}>Any rating</option><option value={3}>3★+</option><option value={4}>4★+</option><option value={4.5}>4.5★+</option>
          </select>
          <select value={sort} onChange={(e) => pickSort(e.target.value)} aria-label="Sort" className="rounded-full border bg-background px-3 py-1.5 text-sm">
            <option value="rating">Top rated</option><option value="name">Name A–Z</option><option value="nearest">Nearest</option>
          </select>
          <div className="ml-auto flex gap-1">
            <button aria-label="Grid view" onClick={() => setLayout("grid")} className={chip(layout === "grid")}><LayoutGrid className="h-4 w-4" /></button>
            <button aria-label="List view" onClick={() => setLayout("list")} className={chip(layout === "list")}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      <p className="my-5 text-sm text-muted-foreground" aria-live="polite">{isLoading ? "Loading…" : `${results.length} facilities found`}</p>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <FacilityCardSkeleton key={i} />)}</div>
      ) : results.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No facilities match these filters</p>
          <p className="text-sm text-muted-foreground">Try removing a filter or searching a different term.</p>
        </div>
      ) : (
        <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          <AnimatePresence>{results.map((f, i) => <FacilityCard key={f.id} facility={f} layout={layout} index={i} />)}</AnimatePresence>
        </div>
      )}
    </div>
  );
}
