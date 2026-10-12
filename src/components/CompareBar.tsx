import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { GitCompare, X } from "lucide-react";
import { facilitiesQuery } from "@/lib/facilities";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function CompareBar() {
  const { compare, toggleCompare, clearCompare } = useApp();
  const { data = [] } = useQuery({ ...facilitiesQuery, enabled: compare.length > 0 });
  const path = useLocation({ select: (l) => l.pathname });
  const show = compare.length > 0 && path !== "/compare" && !path.startsWith("/admin");
  const items = data.filter((f) => compare.includes(f.id));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="glass fixed bottom-5 left-1/2 z-40 flex w-[calc(100vw-10rem)] max-w-xl -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 shadow-card max-sm:left-5 max-sm:w-[calc(100vw-8rem)] max-sm:translate-x-0"
        >
          <GitCompare className="h-4 w-4 shrink-0 text-violet" />
          <div className="flex flex-1 gap-1.5 overflow-x-auto">
            {items.map((f) => (
              <span key={f.id} className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                {f.name.split(" ").slice(0, 2).join(" ")}
                <button onClick={() => toggleCompare(f.id)} aria-label={`Remove ${f.name}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <button onClick={clearCompare} className="hidden text-xs text-muted-foreground hover:text-foreground sm:block">Clear</button>
          <Button asChild variant="hero" size="sm"><Link to="/compare">Compare {compare.length}/3</Link></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
