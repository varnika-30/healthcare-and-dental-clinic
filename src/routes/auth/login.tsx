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

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — Healthcare & Dental Clinic" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: getSafeRedirect(search.redirect),
  }),
  component: Login,
});

function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-primary-gradient md:flex md:flex-col md:justify-between md:p-12 md:text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <ToothIcon className="h-5 w-5" />
          </span>
          Healthcare & Dental Clinic
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">
            Your clinic, in your pocket.
          </h2>
          <p className="mt-2 max-w-sm opacity-90">
            Manage appointments, prescriptions and bills — all in one place.
          </p>
        </div>
        <p className="text-sm opacity-70">© Healthcare & Dental Clinic</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-border/60 p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your Healthcare & Dental Clinic account.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setLoading(true);
              const { data: signIn, error } = await supabase.auth.signInWithPassword({
                email: String(fd.get("email")),
                password: String(fd.get("password")),
              });
              setLoading(false);
              if (error) return toast.error(error.message);
              toast.success("Signed in.");

              // === START TEMPORARY DEVELOPMENT-ONLY AUTH SESSION INSPECTION ===
              if (signIn?.session) {
                const session = signIn.session;
                const user = signIn.user;

                let decodedPayload = null;
                if (session.access_token) {
                  try {
                    const parts = session.access_token.split(".");
                    if (parts.length >= 2) {
                      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                      const jsonPayload = decodeURIComponent(
                        window
                          .atob(base64)
                          .split("")
                          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                          .join(""),
                      );
                      decodedPayload = JSON.parse(jsonPayload);
                    }
                  } catch (err) {
                    console.error("[DEV] Failed to decode JWT payload:", err);
                  }
                }

                console.log("[DEV] Auth Session Diagnostic Audit:", {
                  userId: user?.id,
                  userEmail: user?.email,
                  hasAccessToken: !!session.access_token,
                  hasRefreshToken: !!session.refresh_token,
                  accessTokenExpiresAt: session.expires_at
                    ? new Date(session.expires_at * 1000).toLocaleString()
                    : null,
                  tokenType: session.token_type,
                });

                console.log("[DEV] Decoded JWT Access Token Payload:", decodedPayload);
              }
              // === END TEMPORARY DEVELOPMENT-ONLY AUTH SESSION INSPECTION ===

              const userId = signIn.user?.id;
              if (userId) {
                const { data: profile } = await (supabase as any)
                  .from("profiles")
                  .select("role")
                  .eq("id", userId)
                  .single();
                const isStaff = ["admin", "doctor", "receptionist"].includes(
                  (profile as any)?.role || "",
                );
                const destination =
                  getSafeRedirect(redirect) ?? (isStaff ? "/dashboard" : "/portal");
                navigate({ to: destination });
              } else {
                navigate({ to: getSafeRedirect(redirect) ?? "/portal" });
              }
            }}
          >
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/auth/forgot" className="text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
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
            <Button type="submit" disabled={loading} className="w-full bg-primary-gradient">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to="/auth/signup"
              search={{ redirect }}
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
