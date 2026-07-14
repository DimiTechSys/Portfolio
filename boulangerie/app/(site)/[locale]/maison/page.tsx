import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getShopSettings } from "@/lib/settings";
import { Hand, Wheat, Crown, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaisonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, s] = await Promise.all([
    getTranslations("maison"),
    getShopSettings(),
  ]);

  const values = [
    { icon: Hand, title: t("value1Title"), text: t("value1Text") },
    { icon: Wheat, title: t("value2Title"), text: t("value2Text") },
    { icon: Crown, title: t("value3Title"), text: t("value3Text", { city: s.city }) },
  ];

  return (
    <main>
      <section className="hero-vignette">
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center fade-up">
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <h1 className="text-5xl leading-[1.08]">{t("title", { city: s.city })}</h1>
          <p className="mt-6 text-xl" style={{ color: "var(--color-cream-soft)", fontWeight: 300, fontStyle: "italic" }}>
            {t("lead", { city: s.city })}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-8">
        <div className="space-y-6 text-lg" style={{ color: "var(--color-cream-soft)", fontWeight: 300, lineHeight: 1.8 }}>
          <p>{t("p1")}</p>
          <p>{t("p2", { city: s.city })}</p>
          <p>{t("p3")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="card p-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(201,162,75,.14)", color: "var(--color-gold-soft)" }}>
                  <Icon size={24} />
                </div>
                <h3 className="text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                  {v.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <Link href="/contact" className="btn btn-gold">
            {t("cta")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
