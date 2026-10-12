import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin sign in — MediFind" },
      { name: "description", content: "Sign in to manage the MediFind directory." },
      { property: "og:title", content: "Admin sign in — MediFind" },
      { property: "og:description", content: "Sign in to manage the MediFind directory." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm your account");
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-8">
        <h1 className="text-2xl font-bold">{mode === "in" ? "Admin sign in" : "Create admin account"}</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="w-full rounded-xl bg-muted px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className="w-full rounded-xl bg-muted px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
        <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
        <p className="text-xs text-muted-foreground">The first account created becomes the administrator.</p>
      </form>
    </div>
  );
}
