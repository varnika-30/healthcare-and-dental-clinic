import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — Lumident" }] }),
  component: Login,
});

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-primary-gradient md:flex md:flex-col md:justify-between md:p-12 md:text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><Stethoscope className="h-5 w-5" /></span>
          Lumident
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">Your clinic, in your pocket.</h2>
          <p className="mt-2 max-w-sm opacity-90">Manage appointments, prescriptions and bills — all in one place.</p>
        </div>
        <p className="text-sm opacity-70">© Lumident Dental Clinic</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-border/60 p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your Lumident account.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setLoading(true);
              const { data: signIn, error } = await supabase.auth.signInWithPassword({
                email: String(fd.get("email")), password: String(fd.get("password")),
              });
              setLoading(false);
              if (error) return toast.error(error.message);
              toast.success("Signed in.");
              const userId = signIn.user?.id;
              if (userId) {
                const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
                const isStaff = (roles ?? []).some((r) => ["admin","doctor","receptionist"].includes(r.role));
                navigate({ to: isStaff ? "/dashboard" : "/portal" });
              } else {
                navigate({ to: "/portal" });
              }
            }}
          >
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required maxLength={255} className="mt-1" /></div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/auth/forgot" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <Input id="password" name="password" type="password" required minLength={6} maxLength={72} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary-gradient">{loading ? "Signing in…" : "Sign in"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/auth/signup" className="font-medium text-primary hover:underline">Create an account</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
