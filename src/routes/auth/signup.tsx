import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSafeRedirect } from "@/lib/booking-redirect";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create account — Lumident" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: getSafeRedirect(search.redirect),
  }),
  component: Signup,
});

function Signup() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("patient");
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-primary-gradient md:flex md:flex-col md:justify-between md:p-12 md:text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <Stethoscope className="h-5 w-5" />
          </span>
          Lumident
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">Join 15,000+ patients.</h2>
          <p className="mt-2 max-w-sm opacity-90">
            Book in seconds, see your records, get reminders.
          </p>
        </div>
        <p className="text-sm opacity-70">© Lumident Dental Clinic</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-border/60 p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">It only takes a minute.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setLoading(true);
              const { error } = await supabase.auth.signUp({
                email: String(fd.get("email")),
                password: String(fd.get("password")),
                options: {
                  emailRedirectTo: `${window.location.origin}/dashboard`,
                  data: { full_name: String(fd.get("name")), phone: String(fd.get("phone")), role },
                },
              });
              setLoading(false);
              if (error) return toast.error(error.message);
              toast.success("Account created. Check your email to verify.");
              navigate({
                to: "/auth/login",
                search: { redirect },
              });
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required maxLength={100} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" maxLength={20} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                maxLength={255}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                maxLength={72}
                className="mt-1"
              />
            </div>
            <div>
              <Label>I am a</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Staff accounts are reviewed by clinic admins.
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary-gradient">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              search={{ redirect }}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
