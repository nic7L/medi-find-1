import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { VerifiedBadge, OpenBadge } from "@/components/FacilityCard";
import { StarRating } from "@/components/StarRating";
import { CATEGORY_META, facilitiesQuery, hoursLabel } from "@/lib/facilities";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare facilities — MediFind" },
      { name: "description", content: "Compare up to three health facilities side by side." },
      { property: "og:title", content: "Compare facilities — MediFind" },
      { property: "og:description", content: "Services, hours, rating and verification side by side." },
    ],
  }),
  component: Compare,
});

function Compare() {
  const { compare, toggleCompare } = useApp();
  const { data = [] } = useQuery(facilitiesQuery);
  const items = data.filter((f) => compare.includes(f.id));
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-bold">Compare <span className="text-gradient">side by side</span></h1>
      {items.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <p className="font-semibold">Nothing to compare yet</p>
          <p className="text-sm text-muted-foreground">Use the compare icon on up to 3 facilities in the <Link to="/directory" className="text-teal">directory</Link>.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((f) => (
            <div key={f.id} className="glass relative space-y-4 rounded-3xl p-6">
              <button onClick={() => toggleCompare(f.id)} aria-label="Remove" className="absolute right-4 top-4 text-muted-foreground"><X className="h-4 w-4" /></button>
              <div><p className="text-xs text-muted-foreground">{CATEGORY_META[f.category]?.label}</p><Link to="/facility/$id" params={{ id: f.id }} className="text-lg font-semibold">{f.name}</Link></div>
              <div className="flex gap-2"><VerifiedBadge verified={f.verified} /><OpenBadge facility={f} /></div>
              <div className="flex items-center gap-2"><StarRating value={f.rating} /><span className="text-sm">{f.rating.toFixed(1)}</span></div>
              <p className="text-sm">{hoursLabel(f)}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">{f.services.map((s) => <li key={s}>• {s}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
