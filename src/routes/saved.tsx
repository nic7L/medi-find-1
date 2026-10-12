import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FacilityCard } from "@/components/FacilityCard";
import { facilitiesQuery } from "@/lib/facilities";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved facilities — MediFind" },
      { name: "description", content: "Your saved health facilities." },
      { property: "og:title", content: "Saved facilities — MediFind" },
      { property: "og:description", content: "Your saved health facilities, stored on this device." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { favorites } = useApp();
  const { data = [] } = useQuery(facilitiesQuery);
  const items = data.filter((f) => favorites.includes(f.id));
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-bold">Saved <span className="text-gradient">facilities</span></h1>
      {items.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-sm text-muted-foreground">No saved facilities yet. Tap the heart on any facility in the <Link to="/directory" className="text-teal">directory</Link>.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((f, i) => <FacilityCard key={f.id} facility={f} index={i} />)}</div>
      )}
    </div>
  );
}
