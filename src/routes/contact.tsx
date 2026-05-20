import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lumident Dental" },
      { name: "description", content: "Get in touch with our team — phone, email or visit our clinic." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <Badge variant="secondary" className="mb-3 rounded-full">Contact</Badge>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">We're here to help.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Drop us a line or stop by — we usually reply within an hour.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Phone, title: "Phone", v: "(415) 555-0142" },
            { icon: Mail, title: "Email", v: "hello@lumident.care" },
            { icon: MapPin, title: "Address", v: "24 Bayview Ave, Suite 300" },
            { icon: Clock, title: "Hours", v: "Mon–Sat · 9am–7pm" },
          ].map((c) => (
            <Card key={c.title} className="flex items-center gap-4 rounded-2xl border-border/60 p-5 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><c.icon className="h-5 w-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.title}</p>
                <p className="font-medium">{c.v}</p>
              </div>
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); toast.success("Message sent — we'll be in touch shortly."); (e.target as HTMLFormElement).reset(); }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="n">Name</Label><Input id="n" required maxLength={100} className="mt-1" /></div>
              <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required maxLength={255} className="mt-1" /></div>
            </div>
            <div><Label htmlFor="s">Subject</Label><Input id="s" required maxLength={150} className="mt-1" /></div>
            <div><Label htmlFor="m">Message</Label><Textarea id="m" rows={5} required maxLength={1000} className="mt-1" /></div>
            <Button type="submit" className="w-full bg-primary-gradient">Send message</Button>
          </form>
        </Card>
      </section>
    </SiteLayout>
  );
}
