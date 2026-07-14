"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, BookOpen, ShoppingBag, Settings } from "lucide-react";

const links = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/demandes", label: "Demandes", icon: PhoneCall },
  { href: "/admin/catalogue", label: "Catalogue", icon: BookOpen },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingBag },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mx-auto max-w-6xl px-5">
      <div className="flex gap-1 overflow-x-auto">
        {links.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors"
              style={{
                color: active ? "var(--color-gold-soft)" : "var(--color-muted)",
                borderBottom: active
                  ? "2px solid var(--color-gold)"
                  : "2px solid transparent",
              }}
            >
              <Icon size={16} /> {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
