import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({ meta: [{ title: "Forgot password — Lumident" }] }),
  component: Forgot,
});

function Forgot() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient p-6">
      <Card className="w-full max-w-md rounded-2xl border-border/60 p-8 shadow-soft">
        <h1 className="font-display text-2xl font-bold">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We'll email you a reset link.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const { error } = await supabase.auth.resetPasswordForEmail(String(fd.get("email")), {
              redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) return toast.error(error.message);
            toast.success("Check your inbox for the reset link.");
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-primary-gradient">
            Send reset link
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            to="/auth/login"
            search={{ redirect: undefined }}
            className="text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
