"use client";

import { useState } from "react";
import ProductForm from "./ProductForm";
import { toggleProductVisible, deleteProduct } from "@/app/actions/admin";
import { formatDA, marginPct } from "@/lib/format";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";

type Product = {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  images: string[];
  priceDA: number;
  costDA: number;
  visible: boolean;
  sortOrder: number;
};

export default function CatalogueManager({ products }: { products: Product[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Catalogue</h1>
          <p style={{ color: "var(--color-muted)" }}>
            {products.length} produit(s). Les coûts ne sont jamais visibles côté client.
          </p>
        </div>
        {!creating && (
          <button className="btn btn-gold" onClick={() => { setCreating(true); setEditingId(null); }}>
            <Plus size={18} /> Nouveau produit
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-6">
          <ProductForm onDone={() => setCreating(false)} />
        </div>
      )}

      <div className="space-y-3">
        {products.map((p) => {
          if (editingId === p.id) {
            return (
              <ProductForm key={p.id} product={p} onDone={() => setEditingId(null)} />
            );
          }
          return (
            <div key={p.id} className="card flex items-center gap-4 p-4">
              <div
                className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
                style={{ background: "var(--color-surface-2)" }}
              >
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                    {p.name}
                  </span>
                  {!p.visible && (
                    <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                      (masqué)
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {p.category || "Sans catégorie"}
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div style={{ color: "var(--color-gold-soft)", fontSize: "1.1rem" }}>
                  {formatDA(p.priceDA)}
                </div>
                <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                  coût {formatDA(p.costDA)} · marge {marginPct(p.priceDA, p.costDA)} %
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-ghost"
                  style={{ padding: "0.5rem 0.7rem" }}
                  onClick={() => { setEditingId(p.id); setCreating(false); }}
                  title="Modifier"
                >
                  <Pencil size={15} />
                </button>
                <form action={toggleProductVisible}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-ghost" style={{ padding: "0.5rem 0.7rem" }} title={p.visible ? "Masquer" : "Afficher"}>
                    {p.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </form>
                <form action={deleteProduct} onSubmit={(e) => { if (!confirm(`Supprimer « ${p.name} » ?`)) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-ghost" style={{ padding: "0.5rem 0.7rem" }} title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {products.length === 0 && !creating && (
          <div className="card p-10 text-center" style={{ color: "var(--color-muted)" }}>
            Aucun produit. Cliquez sur « Nouveau produit » pour commencer.
          </div>
        )}
      </div>
    </div>
  );
}
