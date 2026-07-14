import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDA, marginPct } from "@/lib/format";
import { PhoneCall, TrendingUp, Wallet, Percent, ShoppingBag, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [leadsToCall, totalLeads, productCount, orders] = await Promise.all([
    prisma.lead.count({ where: { status: "TO_CALL" } }),
    prisma.lead.count(),
    prisma.product.count(),
    prisma.order.findMany({ include: { items: true } }),
  ]);

  let revenue = 0;
  let cost = 0;
  for (const o of orders) {
    for (const it of o.items) {
      revenue += it.qty * it.unitPriceDA;
      cost += it.qty * it.unitCostDA;
    }
  }
  const profit = revenue - cost;
  const margin = marginPct(revenue, cost);

  const stats = [
    {
      label: "Demandes à rappeler",
      value: String(leadsToCall),
      sub: `${totalLeads} demande(s) au total`,
      icon: PhoneCall,
      href: "/admin/demandes",
    },
    {
      label: "Chiffre d'affaires",
      value: formatDA(revenue),
      sub: `${orders.length} commande(s)`,
      icon: TrendingUp,
      href: "/admin/commandes",
    },
    {
      label: "Bénéfice",
      value: formatDA(profit),
      sub: `Coût de production : ${formatDA(cost)}`,
      icon: Wallet,
      href: "/admin/commandes",
    },
    {
      label: "Marge moyenne",
      value: `${margin} %`,
      sub: "Sur les commandes validées",
      icon: Percent,
      href: "/admin/commandes",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl mb-1">Tableau de bord</h1>
      <p className="mb-8" style={{ color: "var(--color-muted)" }}>
        Vue d'ensemble de votre activité.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="card p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="label" style={{ marginBottom: 0 }}>{s.label}</span>
                <Icon size={18} style={{ color: "var(--color-gold)" }} />
              </div>
              <div className="mt-3 text-3xl" style={{ color: "var(--color-cream)" }}>
                {s.value}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                {s.sub}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/catalogue" className="card flex items-center gap-4 p-6 transition-transform hover:-translate-y-0.5">
          <BookOpen style={{ color: "var(--color-gold)" }} />
          <div>
            <div className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>Gérer le catalogue</div>
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>
              {productCount} produit(s) — photos, prix, coûts
            </div>
          </div>
        </Link>
        <Link href="/admin/commandes" className="card flex items-center gap-4 p-6 transition-transform hover:-translate-y-0.5">
          <ShoppingBag style={{ color: "var(--color-gold)" }} />
          <div>
            <div className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>Saisir une commande</div>
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>
              Suivi des ventes et calcul des marges
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
