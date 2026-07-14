"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ShopSettings } from "@/lib/settings";
import { Phone, MessageCircle } from "lucide-react";

const NAV = [
  { href: "/", key: "catalogue" },
  { href: "/maison", key: "maison" },
] as const;

export default function Footer({ settings }: { settings: ShopSettings }) {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const telHref = `tel:${settings.phoneNumber.replace(/[^0-9+]/g, "")}`;
  const waHref = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`;

  return (
    <footer style={{ borderTop: "1px solid var(--color-line)", background: "var(--color-ink-soft)" }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-3">
        <div>
          <div className="text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--color-cream)" }}>
            {settings.businessName}
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
            {tf("tagline", { city: settings.city })}
          </p>
        </div>

        <div>
          <h4 className="eyebrow mb-4" style={{ fontFamily: "var(--font-sans)" }}>
            {tf("explore")}
          </h4>
          <ul className="space-y-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm" style={{ color: "var(--color-cream-soft)" }}>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4" style={{ fontFamily: "var(--font-sans)" }}>
            {tf("contactTitle")}
          </h4>
          <div className="flex flex-col gap-3">
            <a href={telHref} className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-cream-soft)" }}>
              <Phone size={15} style={{ color: "var(--color-gold)" }} /> {settings.phoneNumber}
            </a>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-cream-soft)" }}>
              <MessageCircle size={15} style={{ color: "var(--color-gold)" }} /> {tf("contactTitle")}
            </a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--color-line)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs sm:flex-row" style={{ color: "var(--color-muted)" }}>
          <span>
            © {settings.businessName} · {settings.city} — {tf("rights")}
          </span>
          {/* Lien hors i18n : back-office en français. */}
          <a href="/admin" style={{ color: "var(--color-muted)" }}>
            {tf("admin")}
          </a>
        </div>
      </div>
    </footer>
  );
}
