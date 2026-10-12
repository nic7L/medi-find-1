import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

type Ctx = {
  favorites: string[];
  toggleFavorite: (id: string, name?: string) => void;
  compare: string[];
  toggleCompare: (id: string, name?: string) => void;
  clearCompare: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

const AppCtx = createContext<Ctx | null>(null);

function usePersisted(key: string) {
  const [val, setVal] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setVal(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [key]);
  const set = useCallback(
    (fn: (prev: string[]) => string[]) =>
      setVal((prev) => {
        const next = fn(prev);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      }),
    [key],
  );
  return [val, set] as const;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = usePersisted("medifind:favorites");
  const [compare, setCompare] = usePersisted("medifind:compare");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("medifind:theme");
    if (t === "light") setTheme("light");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("medifind:theme", theme);
  }, [theme]);

  const toggleFavorite = (id: string, name?: string) =>
    setFavorites((prev) => {
      const has = prev.includes(id);
      toast.success(has ? "Removed from saved" : "Saved to favorites", { description: name });
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });

  const toggleCompare = (id: string, name?: string) =>
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 facilities");
        return prev;
      }
      toast.success("Added to compare", { description: name });
      return [...prev, id];
    });

  return (
    <AppCtx.Provider
      value={{
        favorites,
        toggleFavorite,
        compare,
        toggleCompare,
        clearCompare: () => setCompare(() => []),
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        paletteOpen,
        setPaletteOpen,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
