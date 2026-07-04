import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PatientShell } from "@/components/portal/PatientShell";

export const Route = createFileRoute("/_authenticated/portal")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    //if (!u.user) throw redirect({ to: "/auth/login" });//
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", u.user?.id ?? "")
      .single();
    const isStaff = ["admin", "doctor", "receptionist"].includes((profile as any)?.role || "");
    if (isStaff) throw redirect({ to: "/dashboard" });
  },
  component: () => (
    <PatientShell>
      <Outlet />
    </PatientShell>
  ),
});
