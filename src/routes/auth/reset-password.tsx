import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Lumident" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient p-6">
      <Card className="w-full max-w-md rounded-2xl border-border/60 p-8 shadow-soft">
        <h1 className="font-display text-2xl font-bold">Set a new password</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const { error } = await supabase.auth.updateUser({ password: String(fd.get("password")) });
            if (error) return toast.error(error.message);
            toast.success("Password updated.");
            navigate({ to: "/dashboard" });
          }}
        >
          <div><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" required minLength={6} maxLength={72} className="mt-1" /></div>
          <Button type="submit" className="w-full bg-primary-gradient">Update password</Button>
        </form>
      </Card>
    </div>
  );
}
