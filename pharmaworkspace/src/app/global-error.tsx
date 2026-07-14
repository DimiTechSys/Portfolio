"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/errors/chunk-reload";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Chunk périmé après un déploiement : on recharge (une fois) au lieu d'afficher
    // la page d'erreur — le reload récupère le nouveau manifest de chunks.
    if (isChunkLoadError(error) && reloadOnceForChunkError()) return;
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
