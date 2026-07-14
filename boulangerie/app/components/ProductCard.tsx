import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

// Carte produit cliquable menant à la page produit individuelle.
export default function ProductCard({
  href,
  name,
  description,
  imageUrl,
  priceFormatted,
  viewLabel,
  fallbackName,
}: {
  href: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceFormatted: string;
  viewLabel: string;
  fallbackName: string;
}) {
  return (
    <Link href={href} className="card group overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
      <div className="aspect-[4/3] w-full overflow-hidden" style={{ background: "var(--color-surface-2)" }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span style={{ fontFamily: "var(--font-serif)", color: "var(--color-gold-deep)", fontSize: "1.6rem" }}>
              {fallbackName}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl leading-tight">{name}</h3>
        {description && (
          <p className="mt-2 flex-1 text-sm" style={{ color: "var(--color-cream-soft)", fontWeight: 300 }}>
            {description}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-2xl" style={{ color: "var(--color-gold-soft)" }}>
            {priceFormatted}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--color-cream-soft)" }}
          >
            {viewLabel} <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
