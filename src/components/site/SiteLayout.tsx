import type { ReactNode } from "react";
import { BookAppointmentProvider } from "./BookAppointmentChoice";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <BookAppointmentProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </BookAppointmentProvider>
  );
}
