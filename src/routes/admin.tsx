import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { facilitiesQuery } from "@/lib/facilities";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Admin — MediFind" },
      { name: "description", content: "Manage MediFind facilities." },
      { property: "og:title", content: "Admin — MediFind" },
      { property: "og:description", content: "Manage MediFind facilities." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["admin-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "").eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  const { data = [] } = useQuery(facilitiesQuery);

  const signOut = async () => {
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const toggle = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("facilities").update({ verified: !verified }).eq("id", id);
    if (error) return toast.error("Update failed");
    qc.invalidateQueries({ queryKey: ["facilities"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this facility?")) return;
    const { error } = await supabase.from("facilities").delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    toast.success("Facility deleted");
    qc.invalidateQueries({ queryKey: ["facilities"] });
  };

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <div className="p-10 text-center"><p>This account isn't an administrator.</p><Button variant="glass" onClick={signOut} className="mt-4">Sign out</Button></div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin <span className="text-gradient">dashboard</span></h1>
        <Button variant="glass" onClick={signOut}>Sign out</Button>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Facilities" v={data.length} /><Stat label="Verified" v={data.filter((f) => f.verified).length} /><Stat label="Pending" v={data.filter((f) => !f.verified).length} />
      </div>
      <div className="glass divide-y rounded-3xl">
        {data.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center gap-3 p-4">
            <Link to="/facility/$id" params={{ id: f.id }} className="flex-1 font-medium">{f.name}<span className="ml-2 text-xs text-muted-foreground">{f.area}</span></Link>
            <Button size="sm" variant={f.verified ? "secondary" : "hero"} onClick={() => toggle(f.id, f.verified)}>{f.verified ? "Unverify" : "Verify"}</Button>
            <Button size="sm" variant="destructive" onClick={() => remove(f.id)}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return <div className="glass rounded-2xl p-5 text-center"><p className="text-gradient text-3xl font-bold">{v}</p><p className="text-sm text-muted-foreground">{label}</p></div>;
}
