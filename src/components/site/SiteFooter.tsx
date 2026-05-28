import { Link } from "@tanstack/react-router";
import { Stethoscope, Mail, Phone, MapPin } from "lucide-react";
import { BookAppointmentNavLink } from "./BookAppointmentChoice";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </span>
            Lumident
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Modern dental care, designed around you. Calm clinic, gentle hands, honest pricing.
          </p>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-semibold">Clinic</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about">About us</Link>
            </li>
            <li>
              <Link to="/doctors">Our doctors</Link>
            </li>
            <li>
              <Link to="/services">Services</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-semibold">Patients</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <BookAppointmentNavLink className="transition-colors hover:text-foreground">
                Book appointment
              </BookAppointmentNavLink>
            </li>
            <li>
              <Link to="/auth/login" search={{ redirect: undefined }}>
                Patient portal
              </Link>
            </li>
            <li>
              <Link to="/auth/signup" search={{ redirect: undefined }}>
                Create account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-semibold">Visit us</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 mt-0.5" />
              24 Bayview Ave, Suite 300
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 mt-0.5" />
              (415) 555-0142
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 mt-0.5" />
              hello@lumident.care
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumident Dental Clinic. All rights reserved.
      </div>
    </footer>
  );
}
