import { prisma } from "@/lib/prisma";
import { formatDA, marginPct } from "@/lib/format";
import { deleteOrder } from "@/app/actions/admin";
import OrderComposer from "./OrderComposer";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommandesPage() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="text-3xl mb-1">Commandes</h1>
      <p className="mb-8" style={{ color: "var(--color-muted)" }}>
        Saisissez vos commandes validées pour suivre vos ventes et vos marges.
      </p>

      <OrderComposer products={products.map((p) => ({ id: p.id, name: p.name, priceDA: p.priceDA, costDA: p.costDA }))} />

      <h2 className="text-2xl mt-10 mb-4" style={{ fontFamily: "var(--font-serif)" }}>
        Historique
      </h2>

      {orders.length === 0 ? (
        <div className="card p-10 text-center" style={{ color: "var(--color-muted)" }}>
          Aucune commande enregistrée.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const revenue = o.items.reduce((s, it) => s + it.qty * it.unitPriceDA, 0);
            const cost = o.items.reduce((s, it) => s + it.qty * it.unitCostDA, 0);
            const profit = revenue - cost;
            return (
              <div key={o.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                      Commande #{o.id}
                      {o.customerName ? ` · ${o.customerName}` : ""}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {new Date(o.createdAt).toLocaleString("fr-FR")}
                      {o.customerPhone ? ` · ${o.customerPhone}` : ""}
                    </div>
                  </div>
                  <form action={deleteOrder} className="self-start">
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn btn-ghost" style={{ padding: "0.45rem 0.6rem" }} title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>

                <div className="mt-3 space-y-1">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm" style={{ color: "var(--color-cream-soft)" }}>
                      <span>
                        {it.qty} × {it.productName}
                      </span>
                      <span>{formatDA(it.qty * it.unitPriceDA)}</span>
                    </div>
                  ))}
                  {o.note && (
                    <p className="text-xs italic" style={{ color: "var(--color-muted)" }}>
                      {o.note}
                    </p>
                  )}
                </div>

                <div
                  className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm"
                  style={{ borderColor: "var(--color-line)" }}
                >
                  <span style={{ color: "var(--color-muted)" }}>
                    CA <strong style={{ color: "var(--color-cream)" }}>{formatDA(revenue)}</strong>
                  </span>
                  <span style={{ color: "var(--color-muted)" }}>
                    Coût <strong style={{ color: "var(--color-cream-soft)" }}>{formatDA(cost)}</strong>
                  </span>
                  <span style={{ color: "var(--color-muted)" }}>
                    Bénéfice{" "}
                    <strong style={{ color: "var(--color-gold-soft)" }}>
                      {formatDA(profit)} ({marginPct(revenue, cost)} %)
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
