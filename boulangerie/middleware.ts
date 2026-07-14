import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // On internationalise la vitrine, mais PAS /admin (back-office) ni /api.
  matcher: [
    "/",
    "/(fr|en)/:path*",
    "/((?!api|admin|_next|_vercel|.*\\..*).*)",
  ],
};
