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
    // httpIntegration n'existe pas sur le runtime edge (@sentry/vercel-edge) ;
    // le filtrage du body s'appuie ici sur requestDataIntegration + beforeSend.
    Sentry.requestDataIntegration({
      include: { data: false, cookies: false, headers: false },
    }),
    // Limite les breadcrumbs console aux erreurs (évite de logger des données métier).
    Sentry.consoleIntegration({ levels: ["error"] }),
  ],
});
