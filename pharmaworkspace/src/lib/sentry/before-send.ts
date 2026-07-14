import type { ErrorEvent } from "@sentry/nextjs";

/** Retire toute donnée de requête sensible (cookies, body, headers) et l'email avant envoi (RGPD). */
export function sentryBeforeSend(event: ErrorEvent): ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.headers;
  }
  if (event.user?.email) delete event.user.email;
  return event;
}
