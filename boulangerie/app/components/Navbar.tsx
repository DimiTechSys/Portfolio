"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import type { ShopSettings } from "@/lib/settings";

// Construction d'un lien WhatsApp (helper local, côté client).
function wa(number: string, text: string) {
  return `https://wa.me/${(number || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

const NAV = [
  { href: "/", key: "catalogue" },
  { href: "/maison", key: "maison" },
] as const;

const LOCALES = ["fr", "en"] as const;

export default function Navbar({ settings }: { settings: ShopSettings }) {
  const t = useTranslations("nav");
  const tOrder = useTranslations("order");
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const waHref = wa(
    settings.whatsappNumber,
    tOrder("whatsappGlobal", { shop: settings.businessName }),
  );

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(250,246,238,.82)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-xl tracking-wide"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-cream)" }}
        >
          {settings.businessName}
        </Link>

        {/* Liens — desktop */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm transition-colors"
                style={{ color: active ? "var(--color-gold-soft)" : "var(--color-cream-soft)" }}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LocaleSwitcher pathname={pathname} current={locale} />
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem" }}>
            <WhatsAppIcon size={16} /> {t("order")}
          </a>
        </div>

        {/* Bouton menu — mobile */}
        <button
          className="lg:hidden"
          style={{ color: "var(--color-cream)" }}
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="lg:hidden" style={{ borderTop: "1px solid var(--color-line)" }}>
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-base"
                style={{ color: "var(--color-cream-soft)" }}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between">
              <LocaleSwitcher pathname={pathname} current={locale} />
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem" }}>
                <WhatsAppIcon size={16} /> {t("order")}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LocaleSwitcher({ pathname, current }: { pathname: string; current: string }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span style={{ color: "var(--color-line)" }}>·</span>}
          <Link
            href={pathname}
            locale={loc}
            className="uppercase transition-colors"
            style={{
              color: loc === current ? "var(--color-gold-soft)" : "var(--color-muted)",
              fontWeight: loc === current ? 600 : 400,
            }}
          >
            {loc}
          </Link>
        </span>
      ))}
    </div>
  );
}
