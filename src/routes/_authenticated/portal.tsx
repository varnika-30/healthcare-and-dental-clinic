import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PatientShell } from "@/components/portal/PatientShell";

export const Route = createFileRoute("/_authenticated/portal")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    //if (!u.user) throw redirect({ to: "/auth/login" });//
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      //.eq("user_id", u.user.id);//
      .eq("user_id", u.user?.id ?? "");
    const isStaff = (roles ?? []).some((r) => ["admin", "doctor", "receptionist"].includes(r.role));
    if (isStaff) throw redirect({ to: "/dashboard" });
  },
  component: () => (
    <PatientShell>
      <Outlet />
    </PatientShell>
  ),
});
