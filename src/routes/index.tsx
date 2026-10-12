import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, BadgeCheck, FlaskConical, HeartHandshake, Pill, Search, SlidersHorizontal, Stethoscope, GitCompare } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FacilityCard, FacilityCardSkeleton } from "@/components/FacilityCard";
import { CATEGORY_META, categoriesQuery, facilitiesQuery } from "@/lib/facilities";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediFind — Find the right care, faster" },
      { name: "description", content: "Search, filter and compare verified clinics, labs, pharmacies and support facilities near you." },
      { property: "og:title", content: "MediFind — Find the right care, faster" },
      { property: "og:description", content: "A structured health facility directory with verified listings, ratings and live opening hours." },
    ],
  }),
  component: Landing,
});

function Counter({ to, label }: { to: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v).toString(); } });
    return () => c.stop();
  }, [inView, to]);
  return (
    <div className="glass rounded-2xl px-6 py-5 text-center">
      <span ref={ref} className="text-gradient font-display text-4xl font-bold">0</span>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const ICONS: Record<string, typeof Stethoscope> = { clinic: Stethoscope, lab: FlaskConical, pharmacy: Pill, support: HeartHandshake };

function HeroSearch() {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const { data = [] } = useQuery(facilitiesQuery);
  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return data.filter((f) => f.name.toLowerCase().includes(s) || f.area.toLowerCase().includes(s) || f.services.some((x) => x.toLowerCase().includes(s))).slice(0, 5);
  }, [q, data]);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ to: "/directory", search: { q } }); }}
        className="glass flex items-center gap-2 rounded-full p-2 pl-5 shadow-glow"
      >
        <Search className="h-5 w-5 shrink-0 text-teal" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder="Search clinics, MRI, 24h pharmacy, Ludhiana…"
          aria-label="Search facilities"
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" variant="hero" size="lg" className="px-6">Search</Button>
      </form>
      {focus && suggestions.length > 0 && (
        <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="glass absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl p-1 text-left shadow-card">
          {suggestions.map((f) => (
            <li key={f.id}>
              <Link to="/facility/$id" params={{ id: f.id }} className="flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-accent">
                <span aria-hidden>{CATEGORY_META[f.category]?.emoji}</span>
                <span className="flex-1 text-sm font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">{f.area}</span>
              </Link>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

function Landing() {
  const { data: facilities, isLoading } = useQuery(facilitiesQuery);
  const { data: cats = [] } = useQuery(categoriesQuery);
  const mx = useMotionValue(-500);
  const my = useMotionValue(-500);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });

  const featured = (facilities ?? []).filter((f) => f.verified).sort((a, b) => b.rating - a.rating).slice(0, 6);
  const counts = (slug: string) => (facilities ?? []).filter((f) => f.category === slug).length;

  return (
    <>
      <section
        className="relative -mt-20 flex min-h-screen items-center overflow-hidden px-6 pt-28"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - r.left - 200); my.set(e.clientY - r.top - 200); }}
      >
        <div className="mesh-bg absolute inset-0" aria-hidden />
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
        <div className="animate-float absolute left-[10%] top-[20%] h-72 w-72 rounded-full bg-teal/30 blur-3xl" aria-hidden />
        <div className="animate-float absolute bottom-[10%] right-[8%] h-96 w-96 rounded-full bg-violet/30 blur-3xl [animation-delay:-6s]" aria-hidden />
        <motion.div style={{ x: sx, y: sy }} className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-teal/20 blur-3xl max-md:hidden" aria-hidden />

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
            <BadgeCheck className="h-3.5 w-3.5 text-teal" /> Structured, verified health facility information
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-5xl font-bold leading-[1.05] sm:text-7xl">
            Find the right care,<br /><span className="text-gradient">faster.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mb-10 mt-6 max-w-xl text-lg text-muted-foreground">
            Compare clinics, labs, pharmacies and support services side by side — with live opening hours, real ratings and verification you can trust.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HeroSearch />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3">
            <Counter to={facilities?.length ?? 0} label="Facilities" />
            <Counter to={cats.length} label="Categories" />
            <Counter to={(facilities ?? []).filter((f) => f.verified).length} label="Verified" />
          </motion.div>
        </div>
      </section>

      <Section title="Browse by" accent="category" subtitle="Every listing follows the same structure, so comparing is effortless.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((c, i) => {
            const Icon = ICONS[c.slug] ?? Stethoscope;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                <Link to="/directory" search={{ category: c.slug }} className="glass group block h-full rounded-3xl p-6 transition-shadow hover:shadow-glow">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground"><Icon className="h-6 w-6" /></div>
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-5 flex items-center gap-1 text-sm font-medium text-teal">
                    {counts(c.slug)} listings <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section title="How it" accent="works" subtitle="Three steps from question to the right front door.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Search, t: "Search", d: "Type a name, service or area — results appear as you type." },
            { icon: SlidersHorizontal, t: "Filter", d: "Narrow by category, open now, verified status and rating." },
            { icon: GitCompare, t: "Compare & go", d: "Line up to 3 facilities side by side, then call or get directions." },
          ].map((s, i) => (
            <motion.div key={s.t} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="glass relative rounded-3xl p-7">
              <span className="text-gradient absolute right-6 top-4 font-display text-6xl font-bold opacity-30">0{i + 1}</span>
              <s.icon className="mb-4 h-7 w-7 text-teal" />
              <h3 className="text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section title="Featured" accent="verified" subtitle="Top-rated facilities whose details have been checked by our team.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <FacilityCardSkeleton key={i} />) : featured.map((f, i) => <FacilityCard key={f.id} facility={f} index={i} />)}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="hero" size="lg"><Link to="/directory">Explore the full directory <ArrowRight /></Link></Button>
        </div>
      </Section>
    </>
  );
}

function Section({ title, accent, subtitle, children }: { title: string; accent: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-24">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
        <h2 className="text-3xl font-bold sm:text-4xl">{title} <span className="text-gradient">{accent}</span></h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </motion.div>
      {children}
    </section>
  );
}
