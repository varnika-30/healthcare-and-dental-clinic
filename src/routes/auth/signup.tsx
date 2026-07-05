import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSafeRedirect } from "@/lib/booking-redirect";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { ToothIcon } from "@/components/ui/ToothIcon";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create account — Healthcare & Dental Clinic" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: getSafeRedirect(search.redirect),
  }),
  component: Signup,
});

function Signup() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-primary-gradient md:flex md:flex-col md:justify-between md:p-12 md:text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <ToothIcon className="h-9 w-9 shrink-0" />
          Healthcare & Dental Clinic
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">Join 15,000+ patients.</h2>
          <p className="mt-2 max-w-sm opacity-90">
            Book in seconds, see your records, get reminders.
          </p>
        </div>
        <p className="text-sm opacity-70">© Healthcare & Dental Clinic</p>
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
              const password = String(fd.get("password"));
              const confirmPassword = String(fd.get("confirmPassword"));

              if (password !== confirmPassword) {
                return toast.error("Passwords do not match.");
              }

              setLoading(true);
              const { error } = await supabase.auth.signUp({
                email: String(fd.get("email")),
                password: password,
                options: {
                  data: {
                    full_name: String(fd.get("name")),
                    phone: String(fd.get("phone")),
                  },
                },
              });
              setLoading(false);
              if (error) return toast.error(error.message);
              toast.success("Account created successfully. You can now log in.");
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
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
