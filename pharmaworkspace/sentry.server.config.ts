// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "./src/lib/sentry/before-send";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: sentryBeforeSend,
  integrations: [
    // RGPD : ne joindre ni body, ni cookies, ni headers aux events.
    Sentry.requestDataIntegration({
      include: { data: false, cookies: false, headers: false },
    }),
    // Ne jamais capturer le corps des requêtes entrantes (PII patient/officine).
    Sentry.httpIntegration({ maxIncomingRequestBodySize: "none" }),
    // Limite les breadcrumbs console aux erreurs (évite de logger des données métier).
    Sentry.consoleIntegration({ levels: ["error"] }),
  ],
});
