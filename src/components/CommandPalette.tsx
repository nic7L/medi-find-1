import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CATEGORY_META, facilitiesQuery } from "@/lib/facilities";
import { useApp } from "@/lib/store";
import { GitCompare, Heart, LayoutGrid } from "lucide-react";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useApp();
  const navigate = useNavigate();
  const { data = [] } = useQuery({ ...facilitiesQuery, enabled: paletteOpen });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  const go = (fn: () => void) => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <CommandInput placeholder="Search facilities, services, areas…" />
      <CommandList>
        <CommandEmpty>No facilities found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go(() => navigate({ to: "/directory" }))}><LayoutGrid /> Browse directory</CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/compare" }))}><GitCompare /> Compare facilities</CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/saved" }))}><Heart /> Saved facilities</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Facilities">
          {data.map((f) => (
            <CommandItem
              key={f.id}
              value={`${f.name} ${f.area} ${f.category} ${f.services.join(" ")}`}
              onSelect={() => go(() => navigate({ to: "/facility/$id", params: { id: f.id } }))}
            >
              <span aria-hidden>{CATEGORY_META[f.category]?.emoji}</span>
              <span>{f.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{f.area}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
