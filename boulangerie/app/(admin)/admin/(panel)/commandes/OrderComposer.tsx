"use client";

import { useState, useRef } from "react";
import { createOrder } from "@/app/actions/admin";
import { formatDA, marginPct } from "@/lib/format";
import { Plus, Trash2, Receipt } from "lucide-react";

type Product = {
  id: number;
  name: string;
  priceDA: number;
  costDA: number;
};

type Line = {
  key: string;
  productId: number | null;
  productName: string;
  qty: number;
  unitPriceDA: number;
  unitCostDA: number;
};

export default function OrderComposer({ products }: { products: Product[] }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const counter = useRef(0);

  function addLine() {
    const id = Number(pick);
    const p = products.find((x) => x.id === id);
    if (!p) return;
    counter.current += 1;
    setLines((l) => [
      ...l,
      {
        key: `l${counter.current}`,
        productId: p.id,
        productName: p.name,
        qty: 1,
        unitPriceDA: p.priceDA,
        unitCostDA: p.costDA,
      },
    ]);
    setPick("");
  }

  function update(key: string, patch: Partial<Line>) {
    setLines((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }
  function remove(key: string) {
    setLines((l) => l.filter((x) => x.key !== key));
  }

  const revenue = lines.reduce((s, l) => s + l.qty * l.unitPriceDA, 0);
  const cost = lines.reduce((s, l) => s + l.qty * l.unitCostDA, 0);
  const profit = revenue - cost;

  return (
    <form
      ref={formRef}
      action={createOrder}
      className="card p-6"
      onSubmit={() => {
        // Réinitialise après envoi.
        setTimeout(() => setLines([]), 0);
      }}
    >
      <input type="hidden" name="items" value={JSON.stringify(lines.map(({ key, ...rest }) => { void key; return rest; }))} />

      <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>
        Nouvelle commande
      </h2>

      {/* Sélection produit */}
      <div className="flex flex-wrap gap-2">
        <select
          className="field"
          style={{ flex: 1, minWidth: 200 }}
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="">Choisir un produit…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatDA(p.priceDA)}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" onClick={addLine} disabled={!pick}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Lignes */}
      <div className="mt-4 space-y-2">
        {lines.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Ajoutez des produits pour composer la commande.
          </p>
        )}
        {lines.map((l) => (
          <div
            key={l.key}
            className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2"
            style={{ background: "var(--color-ink-soft)", border: "1px solid var(--color-line)" }}
          >
            <span className="flex-1 min-w-[120px]" style={{ fontFamily: "var(--font-serif)" }}>
              {l.productName}
            </span>
            <label className="text-xs" style={{ color: "var(--color-muted)" }}>
              Qté
              <input
                type="number"
                min={1}
                value={l.qty}
                onChange={(e) => update(l.key, { qty: Math.max(1, Number(e.target.value)) })}
                className="field ml-1"
                style={{ width: 64, display: "inline-block", padding: "0.3rem 0.4rem" }}
              />
            </label>
            <label className="text-xs" style={{ color: "var(--color-muted)" }}>
              PV
              <input
                type="number"
                min={0}
                value={l.unitPriceDA}
                onChange={(e) => update(l.key, { unitPriceDA: Number(e.target.value) })}
                className="field ml-1"
                style={{ width: 80, display: "inline-block", padding: "0.3rem 0.4rem" }}
              />
            </label>
            <label className="text-xs" style={{ color: "var(--color-muted)" }}>
              Coût
              <input
                type="number"
                min={0}
                value={l.unitCostDA}
                onChange={(e) => update(l.key, { unitCostDA: Number(e.target.value) })}
                className="field ml-1"
                style={{ width: 80, display: "inline-block", padding: "0.3rem 0.4rem" }}
              />
            </label>
            <span className="text-sm" style={{ color: "var(--color-gold-soft)", minWidth: 90, textAlign: "right" }}>
              {formatDA(l.qty * l.unitPriceDA)}
            </span>
            <button type="button" onClick={() => remove(l.key)} className="btn btn-ghost" style={{ padding: "0.35rem 0.5rem" }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Totaux */}
      {lines.length > 0 && (
        <div
          className="mt-4 grid grid-cols-3 gap-3 rounded-lg p-4 text-center"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
        >
          <div>
            <div className="text-xs" style={{ color: "var(--color-muted)" }}>Chiffre d'affaires</div>
            <div className="text-lg" style={{ color: "var(--color-cream)" }}>{formatDA(revenue)}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--color-muted)" }}>Coût</div>
            <div className="text-lg" style={{ color: "var(--color-cream-soft)" }}>{formatDA(cost)}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--color-muted)" }}>Bénéfice</div>
            <div className="text-lg" style={{ color: "var(--color-gold-soft)" }}>
              {formatDA(profit)} <span className="text-xs">({marginPct(revenue, cost)} %)</span>
            </div>
          </div>
        </div>
      )}

      {/* Client */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="customerName" className="field" placeholder="Nom du client (optionnel)" />
        <input name="customerPhone" className="field" placeholder="Téléphone (optionnel)" />
      </div>
      <input name="note" className="field mt-3" placeholder="Note (optionnel)" />

      <button type="submit" className="btn btn-gold mt-5" disabled={lines.length === 0}>
        <Receipt size={18} /> Valider la commande
      </button>
    </form>
  );
}
