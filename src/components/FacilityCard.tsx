import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BadgeCheck, Clock, GitCompare, Heart, MapPin } from "lucide-react";
import { CATEGORY_META, hoursLabel, isOpenNow, type Facility } from "@/lib/facilities";
import { useApp } from "@/lib/store";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";
import { useHydrated } from "@tanstack/react-router";

export function OpenBadge({ facility }: { facility: Facility | Parameters<typeof isOpenNow>[0] }) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const open = isOpenNow(facility);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        open ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", open ? "bg-success animate-pulse" : "bg-destructive")} />
      {open ? "Open now" : "Closed"}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
      <BadgeCheck className="h-3.5 w-3.5" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Unverified
    </span>
  );
}

export function FacilityCard({ facility, layout = "grid", index = 0 }: { facility: Facility; layout?: "grid" | "list"; index?: number }) {
  const { favorites, toggleFavorite, compare, toggleCompare } = useApp();
  const fav = favorites.includes(facility.id);
  const cmp = compare.includes(facility.id);
  const meta = CATEGORY_META[facility.category];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.04 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative glass rounded-2xl p-5 shadow-card transition-shadow hover:shadow-glow",
        layout === "list" && "flex flex-col gap-4 sm:flex-row sm:items-center",
      )}
    >
      <div className="flex-1">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-xl" aria-hidden>
              {meta?.emoji ?? "🏥"}
            </div>
            <div>
              <Link
                to="/facility/$id"
                params={{ id: facility.id }}
                className="font-semibold leading-tight after:absolute after:inset-0 focus-visible:outline-none"
              >
                {facility.name}
              </Link>
              <p className="text-xs text-muted-foreground">{meta?.label ?? facility.category}</p>
            </div>
          </div>
          <div className="relative z-10 flex gap-1">
            <button
              onClick={() => toggleCompare(facility.id, facility.name)}
              aria-label={cmp ? "Remove from compare" : "Add to compare"}
              className={cn(
                "rounded-full p-2 transition-colors hover:bg-accent",
                cmp ? "text-violet" : "text-muted-foreground",
              )}
            >
              <GitCompare className="h-4 w-4" />
            </button>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleFavorite(facility.id, facility.name)}
              aria-label={fav ? "Remove from saved" : "Save facility"}
              className="rounded-full p-2 transition-colors hover:bg-accent"
            >
              <Heart className={cn("h-4 w-4", fav ? "fill-destructive text-destructive" : "text-muted-foreground")} />
            </motion.button>
          </div>
        </div>
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{facility.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <VerifiedBadge verified={facility.verified} />
          <OpenBadge facility={facility} />
        </div>
      </div>
      <div className={cn("mt-4 space-y-2 border-t pt-4 text-sm", layout === "list" && "sm:mt-0 sm:w-64 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0")}>
        <div className="flex items-center gap-2">
          <StarRating value={facility.rating} />
          <span className="font-medium">{facility.rating ? facility.rating.toFixed(1) : "New"}</span>
          <span className="text-muted-foreground">({facility.reviewCount})</span>
        </div>
        <p className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {facility.area}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {hoursLabel(facility)}
        </p>
      </div>
    </motion.article>
  );
}

export function FacilityCardSkeleton() {
  return (
    <div className="glass animate-pulse rounded-2xl p-5">
      <div className="mb-4 flex gap-3">
        <div className="h-11 w-11 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mb-2 h-3 rounded bg-muted" />
      <div className="mb-6 h-3 w-4/5 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}
