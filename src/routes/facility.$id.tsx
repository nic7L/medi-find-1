import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { OpenBadge, VerifiedBadge } from "@/components/FacilityCard";
import { StarInput, StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { CATEGORY_META, facilitiesQuery, feedbackQuery, hoursLabel, mapsUrl } from "@/lib/facilities";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/facility/$id")({
  head: () => ({
    meta: [
      { title: "Facility profile — MediFind" },
      { name: "description", content: "Services, opening hours, contact details and reviews." },
      { property: "og:title", content: "Facility profile — MediFind" },
      { property: "og:description", content: "Services, opening hours, contact details and reviews." },
    ],
  }),
  component: FacilityPage,
});

const reviewSchema = z.object({
  user_name: z.string().trim().min(1, "Enter your name").max(60),
  rating: z.number().min(1, "Choose a rating").max(5),
  comment: z.string().trim().min(5, "Write at least 5 characters").max(1000),
});

function FacilityPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(facilitiesQuery);
  const { data: reviews = [] } = useQuery(feedbackQuery(id));
  const [form, setForm] = useState({ user_name: "", rating: 0, comment: "" });
  const [busy, setBusy] = useState(false);
  const f = data.find((x) => x.id === id);

  if (isLoading) return <div className="mx-auto max-w-5xl px-6 py-20 text-muted-foreground">Loading…</div>;
  if (!f) return <div className="mx-auto max-w-5xl px-6 py-20 text-center"><p className="text-xl font-semibold">Facility not found</p><Link to="/directory" className="text-teal">Back to directory</Link></div>;

  const breakdown = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = reviewSchema.safeParse(form);
    if (!p.success) return toast.error(p.error.issues[0]?.message);
    setBusy(true);
    const { error } = await supabase.from("feedback").insert({ facility_id: id, user_name: p.data.user_name, rating: p.data.rating, comment: p.data.comment });
    setBusy(false);
    if (error) return toast.error("Could not post review");
    toast.success("Thanks for your review!");
    setForm({ user_name: "", rating: 0, comment: "" });
    qc.invalidateQueries({ queryKey: ["feedback", id] });
    qc.invalidateQueries({ queryKey: ["facilities"] });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="glass rounded-3xl p-8">
        <p className="mb-2 text-sm text-muted-foreground">{CATEGORY_META[f.category]?.emoji} {CATEGORY_META[f.category]?.label ?? f.category}</p>
        <h1 className="text-4xl font-bold">{f.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <VerifiedBadge verified={f.verified} /><OpenBadge facility={f} />
          <StarRating value={f.rating} /><span className="text-sm">{f.rating.toFixed(1)} ({f.reviewCount} reviews)</span>
        </div>
        <p className="mt-4 text-muted-foreground">{f.description}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-3 text-lg font-semibold">Services</h2>
          <div className="flex flex-wrap gap-2">{f.services.map((s) => <span key={s} className="rounded-full bg-muted px-3 py-1 text-sm">{s}</span>)}</div>
        </div>
        <div className="glass space-y-3 rounded-3xl p-6 text-sm">
          <h2 className="text-lg font-semibold">Details</h2>
          <a href={mapsUrl(f)} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-teal"><MapPin className="h-4 w-4" />{f.address}, {f.area}</a>
          <p className="flex gap-2"><Clock className="h-4 w-4" />{hoursLabel(f)}</p>
          {f.phone && <a href={`tel:${f.phone}`} className="flex gap-2 hover:text-teal"><Phone className="h-4 w-4" />{f.phone}</a>}
          {f.email && <a href={`mailto:${f.email}`} className="flex gap-2 hover:text-teal"><Mail className="h-4 w-4" />{f.email}</a>}
          {f.website && <a href={f.website} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-teal"><Globe className="h-4 w-4" />{f.website}</a>}
        </div>
      </div>
      <div className="glass grid gap-8 rounded-3xl p-6 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Rating breakdown</h2>
          {breakdown.map(({ s, n }) => (
            <div key={s} className="mb-2 flex items-center gap-3 text-sm">
              <span className="w-6">{s}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-brand" style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%` }} /></div>
              <span className="w-6 text-muted-foreground">{n}</span>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          <StarInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          <input value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} placeholder="Your name" aria-label="Your name" className="w-full rounded-xl bg-muted px-4 py-2 outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Share your experience" aria-label="Comment" rows={3} className="w-full rounded-xl bg-muted px-4 py-2 outline-none focus:ring-2 focus:ring-ring" />
          <Button type="submit" variant="hero" disabled={busy}>{busy ? "Posting…" : "Post review"}</Button>
        </form>
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between"><span className="font-medium">{r.user_name}</span><StarRating value={r.rating} /></div>
            <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
