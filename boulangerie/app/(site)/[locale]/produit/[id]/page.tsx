import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { getShopSettings, waLink } from "@/lib/settings";
import { formatDA } from "@/lib/format";
import ContactSection from "@/app/components/ContactSection";
import ProductGallery from "@/app/components/ProductGallery";
import WhatsAppIcon from "@/app/components/WhatsAppIcon";
import { ArrowLeft, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const productId = Number(id);
  const product = Number.isFinite(productId)
    ? await prisma.product.findUnique({ where: { id: productId } })
    : null;

  // Produit inexistant ou masqué de la vitrine.
  if (!product || !product.visible) notFound();

  const [t, tOrder, s] = await Promise.all([
    getTranslations("product"),
    getTranslations("order"),
    getShopSettings(),
  ]);

  const waHref = waLink(
    s.whatsappNumber,
    tOrder("whatsappProduct", {
      shop: s.businessName,
      product: product.name,
      price: formatDA(product.priceDA),
    }),
  );
  const telHref = `tel:${s.phoneNumber.replace(/[^0-9+]/g, "")}`;

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          <ArrowLeft size={15} /> {t("back")}
        </Link>
      </div>

      <article className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Visuel(s) — carrousel si plusieurs photos */}
          <ProductGallery
            images={product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : []}
            alt={product.name}
            fallbackName={s.businessName}
          />

          {/* Détails */}
          <div className="fade-up">
            {product.category && (
              <p className="eyebrow mb-3">{product.category}</p>
            )}
            <h1 className="text-5xl leading-[1.05]">{product.name}</h1>
            <div className="mt-5 text-3xl" style={{ color: "var(--color-gold-soft)" }}>
              {formatDA(product.priceDA)}
            </div>

            {product.description && (
              <p className="mt-6 text-lg" style={{ color: "var(--color-cream-soft)", fontWeight: 300, lineHeight: 1.8 }}>
                {product.description}
              </p>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                <WhatsAppIcon size={18} /> {t("order")}
              </a>
              <a href={telHref} className="btn btn-ghost">
                <Phone size={18} /> {t("call")}
              </a>
            </div>
          </div>
        </div>
      </article>

      <ContactSection />
    </main>
  );
}
