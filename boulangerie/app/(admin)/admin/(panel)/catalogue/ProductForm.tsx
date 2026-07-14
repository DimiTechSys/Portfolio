"use client";

import { saveProduct } from "@/app/actions/admin";
import { marginPct, formatDA } from "@/lib/format";
import { useRef, useState } from "react";
import { Camera, Upload, Loader2, X, Star } from "lucide-react";

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

// Redimensionne/compresse l'image côté client (pour rester léger et rapide).
async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }
  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", quality),
  );
}

export default function ProductForm({
  product,
  onDone,
}: {
  product?: Product;
  onDone?: () => void;
}) {
  const [price, setPrice] = useState(product?.priceDA ?? 0);
  const [cost, setCost] = useState(product?.costDA ?? 0);
  const [images, setImages] = useState<string[]>(
    product?.images?.length
      ? product.images
      : product?.imageUrl
        ? [product.imageUrl]
        : [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const captureRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const profit = price - cost;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const blob = await compressImage(file);
        const fd = new FormData();
        fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Échec de l'envoi.");
        setImages((prev) => [...prev, json.url]);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setUploading(false);
      if (captureRef.current) captureRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function makeCover(i: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [picked] = copy.splice(i, 1);
      return [picked, ...copy];
    });
  }
  function addUrl() {
    const u = urlInput.trim();
    if (u) {
      setImages((prev) => [...prev, u]);
      setUrlInput("");
    }
  }

  return (
    <form action={saveProduct} className="card p-5" onSubmit={() => onDone?.()}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nom du produit</label>
          <input name="name" className="field" defaultValue={product?.name} required />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <input
            name="category"
            className="field"
            defaultValue={product?.category ?? ""}
            placeholder="Viennoiseries, Pains…"
          />
        </div>
        <div>
          <label className="label">Ordre d'affichage</label>
          <input
            name="sortOrder"
            type="number"
            className="field"
            defaultValue={product?.sortOrder ?? 0}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea
            name="description"
            className="field"
            rows={2}
            defaultValue={product?.description ?? ""}
          />
        </div>

        {/* Photos : galerie (plusieurs) */}
        <div className="sm:col-span-2">
          <label className="label">
            Photos du produit {images.length > 0 && `(${images.length})`}
          </label>

          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative h-24 w-24 overflow-hidden rounded-lg"
                  style={{ background: "var(--color-surface-2)", border: i === 0 ? "2px solid var(--color-gold)" : "1px solid var(--color-line)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 ? (
                    <span
                      className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px]"
                      style={{ background: "var(--color-gold)", color: "#2a2008" }}
                    >
                      Couverture
                    </span>
                  ) : (
                    <button
                      type="button"
                      title="Définir comme couverture"
                      onClick={() => makeCover(i)}
                      className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Retirer"
                    onClick={() => removeAt(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              onClick={() => captureRef.current?.click()}
              disabled={uploading}
            >
              <Camera size={16} /> Prendre une photo
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={16} /> Charger des images
            </button>
            {uploading && (
              <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--color-gold-soft)" }}>
                <Loader2 size={16} className="animate-spin" /> Envoi…
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
            La première photo (couverture) s'affiche sur le catalogue. Les autres
            défilent sur la page du produit.
          </p>
          {uploadError && (
            <p className="mt-1 text-xs" style={{ color: "#b4471f" }}>{uploadError}</p>
          )}

          {/* Entrées caméra (mobile) et galerie (multiple) */}
          <input
            ref={captureRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Ajouter par URL (optionnel) */}
          <div className="mt-3 flex gap-2">
            <input
              className="field"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="…ou collez une URL d'image (https://…)"
            />
            <button type="button" className="btn btn-ghost" onClick={addUrl} disabled={!urlInput.trim()}>
              Ajouter
            </button>
          </div>
        </div>

        <div>
          <label className="label">Prix de vente (DA)</label>
          <input
            name="priceDA"
            type="number"
            min={0}
            className="field"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label">Coût de production (DA)</label>
          <input
            name="costDA"
            type="number"
            min={0}
            className="field"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3"
        style={{ background: "var(--color-ink-soft)", border: "1px solid var(--color-line)" }}
      >
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          Bénéfice unitaire
        </span>
        <span className="text-lg" style={{ color: profit >= 0 ? "var(--color-gold-soft)" : "#b4471f" }}>
          {formatDA(profit)} <span className="text-sm">({marginPct(price, cost)} % de marge)</span>
        </span>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm" style={{ color: "var(--color-cream-soft)" }}>
        <input type="checkbox" name="visible" defaultChecked={product?.visible ?? true} />
        Visible sur la vitrine
      </label>

      <div className="mt-5 flex gap-2">
        <button type="submit" className="btn btn-gold" disabled={uploading}>
          {product ? "Enregistrer" : "Ajouter au catalogue"}
        </button>
        {onDone && (
          <button type="button" className="btn btn-ghost" onClick={onDone}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
