import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarCheck, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { BOOKING_REDIRECT } from "@/lib/booking-redirect";
import { cn } from "@/lib/utils";

export const CLINIC_PHONE_DISPLAY = "(415) 555-0142";
export const CLINIC_PHONE_TEL = "+14155550142";

type BookAppointmentContextValue = {
  openBooking: () => void;
};

const BookAppointmentContext = createContext<BookAppointmentContextValue | null>(null);

export function BookAppointmentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openBooking = useCallback(() => setOpen(true), []);

  return (
    <BookAppointmentContext.Provider value={{ openBooking }}>
      {children}
      <BookAppointmentChoiceDialog open={open} onOpenChange={setOpen} />
    </BookAppointmentContext.Provider>
  );
}

export function useBookAppointment() {
  const ctx = useContext(BookAppointmentContext);
  if (!ctx) {
    throw new Error("useBookAppointment must be used within BookAppointmentProvider");
  }
  return ctx;
}

function BookAppointmentChoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOnline = () => {
    onOpenChange(false);
    if (user) {
      navigate({ to: BOOKING_REDIRECT });
      return;
    }
    navigate({ to: "/auth/login", search: { redirect: BOOKING_REDIRECT } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-3xl border-border/60 p-0 shadow-card sm:max-w-xl">
        <DialogHeader className="space-y-2 border-b border-border/60 bg-muted/30 px-6 py-6 text-left sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-soft">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Book an appointment
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed">
                Choose how you&apos;d like to schedule with Lumident.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:gap-5 sm:p-8">
          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-foreground">
              Call to Book
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Speak directly with our clinic team for faster scheduling.
            </p>
            <p className="mt-3 font-display text-lg font-bold tracking-tight text-foreground">
              {CLINIC_PHONE_DISPLAY}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-5 w-full rounded-xl bg-primary-gradient shadow-soft"
            >
              <a href={`tel:${CLINIC_PHONE_TEL}`}>Call Now</a>
            </Button>
          </div>

          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-foreground">
              Book Online
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Create an account and schedule appointments digitally.
            </p>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="mt-5 w-full rounded-xl border-primary/30 hover:bg-primary-soft/50"
              onClick={handleOnline}
            >
              Continue Online Booking
            </Button>
            {!user && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                New patient?{" "}
                <Link
                  to="/auth/signup"
                  search={{ redirect: BOOKING_REDIRECT }}
                  className="font-medium text-primary hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  Create an account
                </Link>
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type BookAppointmentButtonProps = {
  children: ReactNode;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function BookAppointmentButton({
  children,
  className,
  size,
  variant,
}: BookAppointmentButtonProps) {
  const { openBooking } = useBookAppointment();
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(className)}
      onClick={openBooking}
    >
      {children}
    </Button>
  );
}

export function BookAppointmentNavLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { openBooking } = useBookAppointment();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        openBooking();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
