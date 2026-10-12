import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Command, Heart, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/directory", label: "Directory" },
  { to: "/compare", label: "Compare" },
  { to: "/saved", label: "Saved" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-primary-foreground shadow-glow">+</span>
      Medi<span className="text-gradient">Find</span>
    </Link>
  );
}

export function Navbar() {
  const { theme, toggleTheme, setPaletteOpen, favorites, compare } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 shadow-card">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent/60" }}
            >
              {l.label}
              {l.to === "/saved" && favorites.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gradient-brand px-1.5 text-[10px] font-bold text-primary-foreground">{favorites.length}</span>
              )}
              {l.to === "/compare" && compare.length > 0 && (
                <span className="ml-1.5 rounded-full bg-violet px-1.5 text-[10px] font-bold text-primary-foreground">{compare.length}</span>
              )}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Search className="h-3.5 w-3.5" /> Search
            <kbd className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px]"><Command className="h-2.5 w-2.5" />K</kbd>
          </button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme} aria-label="Toggle theme">
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.span>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto mt-2 max-w-6xl rounded-2xl p-2 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm hover:bg-accent">
              {l.to === "/saved" && <Heart className="h-4 w-4" />}
              {l.label}
            </Link>
          ))}
          <button onClick={() => { setOpen(false); setPaletteOpen(true); }} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm hover:bg-accent">
            <Search className="h-4 w-4" /> Quick search
          </button>
        </motion.div>
      )}
    </header>
  );
}
