import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { BookAppointmentNavLink } from "./BookAppointmentChoice";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex flex-col md:flex-row justify-between max-w-[1600px] px-8 sm:px-10 py-4 gap-6 w-full">
        <div className="w-full md:w-[22%]">
          <div className="font-display text-lg font-bold">
            Healthcare & Dental Clinic
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground leading-relaxed">
            Gentle care for healthy teeth and happy smiles.
          </p>
        </div>
        <div className="w-full md:w-[22%]">
          <p className="mb-2 font-display text-sm font-semibold">Clinic</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/" hash="doctors">Our doctors</Link>
            </li>
            <li>
              <Link to="/" hash="services">Services</Link>
            </li>
            <li>
              <Link to="/" hash="contact">Contact</Link>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-[22%]">
          <p className="mb-2 font-display text-sm font-semibold">Patients</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
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
        <div className="w-full md:w-[22%]">
          <p className="mb-2 font-display text-sm font-semibold">Visit us</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Baba Sharan CHS, Plot 60/61, Sector 44, Seawoods, Navi Mumbai – 400706
              </span>
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 mt-0.5 shrink-0" />
              <span>8369559331</span>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 mt-0.5 shrink-0" />
              <span>dranahitamandal@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-2 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Healthcare & Dental Clinic. All rights reserved.
      </div>
    </footer>
  );
}
