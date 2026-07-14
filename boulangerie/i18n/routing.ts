import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // fr = langue par défaut (sans préfixe), en préfixé (/en).
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
