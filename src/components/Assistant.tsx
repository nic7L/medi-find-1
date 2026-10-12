import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Search, Send, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { CATEGORY_META, facilitiesQuery, isOpenNow, type Facility } from "@/lib/facilities";
import { useApp } from "@/lib/store";

type Msg = { from: "bot" | "user"; text: string; results?: Facility[] };

const SUGGESTIONS = [
  "Find a 24-hour pharmacy near me",
  "Verified labs in Chandigarh",
  "Clinics open now",
  "Where can I get physiotherapy?",
];

function answer(q: string, data: Facility[]): Msg {
  const s = q.toLowerCase();
  let list = [...data];
  const tags: string[] = [];
  const catMap: Record<string, string[]> = {
    pharmacy: ["pharmacy", "pharmacies", "chemist", "medicine"],
    lab: ["lab", "test", "diagnostic", "scan", "mri", "blood test"],
    clinic: ["clinic", "doctor", "dentist", "dental", "eye"],
    support: ["support", "rehab", "physio", "counsel", "blood bank", "ambulance", "nursing"],
  };
  for (const [cat, words] of Object.entries(catMap)) {
    if (words.some((w) => s.includes(w))) {
      list = list.filter((f) => f.category === cat);
      tags.push((CATEGORY_META[cat]?.label ?? cat).toLowerCase() + "s");
      break;
    }
  }
  const areas = Array.from(new Set(data.map((f) => f.area)));
  const area = areas.find((a) => s.includes(a.toLowerCase()));
  if (area) { list = list.filter((f) => f.area === area); tags.push(`in ${area}`); }
  if (s.includes("24")) { list = list.filter((f) => f.is_24h); tags.push("open 24 hours"); }
  if (s.includes("open now") || s.includes("open")) { list = list.filter((f) => isOpenNow(f)); if (!tags.includes("open 24 hours")) tags.push("open now"); }
  if (s.includes("verified")) { list = list.filter((f) => f.verified); tags.push("verified"); }
  const words = s.split(/\W+/).filter((w) => w.length > 3);
  const serviceHits = list.filter((f) => f.services.some((sv) => words.some((w) => sv.toLowerCase().includes(w.slice(0, 5)))));
  if (serviceHits.length && !tags.length) list = serviceHits;
  list.sort((a, b) => b.rating - a.rating);
  if (!list.length) return { from: "bot", text: "I couldn't find a match for that. Try a category (pharmacy, lab, clinic), an area, or “open now”." };
  return {
    from: "bot",
    text: `Here ${list.length === 1 ? "is" : "are"} the top ${Math.min(list.length, 4)} ${tags.join(" ") || "matches"}${s.includes("near me") ? " — sorted by rating; use the Directory's “Nearest” sort to use your location" : ""}:`,
    results: list.slice(0, 4),
  };
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi! I'm the MediFind assistant. Tell me what kind of care you need and I'll find matching facilities." },
  ]);
  const { data = [] } = useQuery({ ...facilitiesQuery, enabled: open });
  const { setPaletteOpen } = useApp();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "user", text: q }, answer(q, data)]);
    setInput("");
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPaletteOpen(true)}
          className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-card"
        >
          <Search className="h-4 w-4 text-teal" /> Quick Find
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close assistant" : "Open assistant"}
          className="grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow"
        >
          {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </motion.button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl shadow-card"
            role="dialog"
            aria-label="MediFind assistant"
          >
            <div className="flex items-center gap-3 border-b bg-gradient-brand/10 px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><Bot className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold">Care Assistant</p>
                <p className="text-xs text-muted-foreground">Answers from the MediFind directory</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={m.from === "user" ? "flex justify-end" : ""}>
                  <div className={m.from === "user" ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-brand px-3 py-2 text-sm text-primary-foreground" : "max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"}>
                    {m.text}
                    {m.results && (
                      <div className="mt-2 space-y-1.5">
                        {m.results.map((f) => (
                          <Link key={f.id} to="/facility/$id" params={{ id: f.id }} onClick={() => setOpen(false)} className="block rounded-xl bg-background/60 px-3 py-2 hover:bg-background">
                            <span className="font-medium">{f.name}</span>
                            <span className="block text-xs text-muted-foreground">{f.area} · ★ {f.rating.toFixed(1)}{f.is_24h ? " · 24h" : ""}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {msgs.length === 1 && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-teal hover:text-foreground">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t p-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for a facility…" aria-label="Message" className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" aria-label="Send" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><Send className="h-4 w-4" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
