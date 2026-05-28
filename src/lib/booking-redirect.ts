/** Allowed post-auth redirects from the public booking flow */
const ALLOWED_REDIRECTS = ["/book", "/portal", "/portal/appointments"] as const;

export function getSafeRedirect(redirect: unknown): string | undefined {
  if (typeof redirect !== "string" || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return undefined;
  }
  const match = ALLOWED_REDIRECTS.find((p) => redirect === p || redirect.startsWith(`${p}/`));
  return match ? redirect : undefined;
}

export const BOOKING_REDIRECT = "/book";
