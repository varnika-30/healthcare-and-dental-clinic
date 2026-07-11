/** Allowed post-auth redirects from the public booking flow */
const ALLOWED_REDIRECTS = ["/portal", "/portal/appointments"] as const;

export function getSafeRedirect(redirect: unknown): string | undefined {
  if (typeof redirect !== "string" || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return undefined;
  }
  const cleanPath = redirect.split("?")[0];
  const match = ALLOWED_REDIRECTS.find((p) => cleanPath === p || cleanPath.startsWith(`${p}/`));
  return match ? redirect : undefined;
}

export const BOOKING_REDIRECT = "/portal/appointments";
