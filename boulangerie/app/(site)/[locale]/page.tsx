import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getShopSettings, waLink } from "@/lib/settings";
import { formatDA } from "@/lib/format";
import ProductCard from "@/app/components/ProductCard";
import ContactSection from "@/app/components/ContactSection";
import WhatsAppIcon from "@/app/components/WhatsAppIcon";

export const dynamic = "force-dynamic";

export default async function CatalogueHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tHero, tCat, tOrder, s, products] = await Promise.all([
    getTranslations("hero"),
    getTranslations("catalogue"),
    getTranslations("order"),
    getShopSettings(),
    prisma.product.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  const waGlobal = waLink(s.whatsappNumber, tOrder("whatsappGlobal", { shop: s.businessName }));

  // Regroupement par catégorie en conservant l'ordre d'apparition.
  const categories: string[] = [];
  const byCat = new Map<string, typeof products>();
  for (const p of products) {
    const c = p.category || tCat("uncategorized");
    if (!byCat.has(c)) {
      byCat.set(c, []);
      categories.push(c);
    }
    byCat.get(c)!.push(p);
  }

  return (
    <main>
      {/* Héros */}
      <section className="hero-vignette relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-20 sm:pt-28 sm:pb-24 text-center fade-up">
          <p className="eyebrow mb-5">{tHero("eyebrow", { city: s.city })}</p>
          <h1 className="mx-auto max-w-3xl text-5xl sm:text-6xl leading-[1.05]">
            {tHero("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg" style={{ color: "var(--color-cream-soft)", fontWeight: 300 }}>
            {tHero("subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={waGlobal} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <WhatsAppIcon size={18} /> {tHero("ctaOrder")}
            </a>
          </div>
        </div>
        <div className="gold-rule mx-auto max-w-6xl" />
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="eyebrow mb-3">{tCat("eyebrow")}</p>
          <h2 className="text-4xl">{tCat("title")}</h2>
          <p className="mx-auto mt-4 max-w-xl" style={{ color: "var(--color-cream-soft)", fontWeight: 300 }}>
            {tCat("subtitle")}
          </p>
        </div>

        {products.length === 0 && (
          <p className="text-center" style={{ color: "var(--color-muted)" }}>
            {tCat("empty")}
          </p>
        )}

        {categories.map((cat) => (
          <div key={cat} className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <h3 className="text-2xl" style={{ color: "var(--color-gold-soft)" }}>
                {cat}
              </h3>
              <div className="gold-rule flex-1 opacity-60" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {byCat.get(cat)!.map((p) => (
                <ProductCard
                  key={p.id}
                  href={`/produit/${p.id}`}
                  name={p.name}
                  description={p.description}
                  imageUrl={p.imageUrl}
                  priceFormatted={formatDA(p.priceDA)}
                  viewLabel={tCat("view")}
                  fallbackName={s.businessName}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <ContactSection />
    </main>
  );
}
