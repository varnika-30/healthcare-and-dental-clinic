import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getOrCreateMyPatient } from "@/lib/patient";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/settings")({
  head: () => ({ meta: [{ title: "Settings — Lumident" }] }),
  component: PortalSettings,
});

function PortalSettings() {
  const { user } = useAuth();
  const [p, setP] = useState<{ full_name: string; phone: string; date_of_birth: string; allergies: string; emergency_contact_name: string; emergency_contact_phone: string; id: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOrCreateMyPatient().then((row) => row && setP({
      id: row.id,
      full_name: row.full_name ?? "",
      phone: row.phone ?? "",
      date_of_birth: row.date_of_birth ?? "",
      allergies: row.allergies ?? "",
      emergency_contact_name: row.emergency_contact_name ?? "",
      emergency_contact_phone: row.emergency_contact_phone ?? "",
    }));
  }, []);

  if (!p) return <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>;

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile and medical info.</p>
      </div>
      <Card className="max-w-2xl rounded-2xl border-border/60 p-6 shadow-soft">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await supabase.from("patients").update({
            full_name: p.full_name, phone: p.phone, date_of_birth: p.date_of_birth || null,
            allergies: p.allergies || null,
            emergency_contact_name: p.emergency_contact_name || null,
            emergency_contact_phone: p.emergency_contact_phone || null,
          }).eq("id", p.id);
          setLoading(false);
          if (error) return toast.error(error.message);
          toast.success("Profile updated.");
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Full name</Label><Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} className="mt-1" required maxLength={100} /></div>
            <div><Label>Phone</Label><Input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className="mt-1" maxLength={20} /></div>
          </div>
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled className="mt-1" /></div>
          <div><Label>Date of birth</Label><Input type="date" value={p.date_of_birth} onChange={(e) => setP({ ...p, date_of_birth: e.target.value })} className="mt-1" /></div>
          <div><Label>Allergies</Label><Textarea value={p.allergies} onChange={(e) => setP({ ...p, allergies: e.target.value })} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Emergency contact</Label><Input value={p.emergency_contact_name} onChange={(e) => setP({ ...p, emergency_contact_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Emergency phone</Label><Input value={p.emergency_contact_phone} onChange={(e) => setP({ ...p, emergency_contact_phone: e.target.value })} className="mt-1" /></div>
          </div>
          <Button type="submit" disabled={loading} className="bg-primary-gradient">{loading ? "Saving…" : "Save changes"}</Button>
        </form>
      </Card>
    </>
  );
}
