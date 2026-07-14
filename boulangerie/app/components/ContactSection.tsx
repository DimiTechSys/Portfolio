import { getTranslations } from "next-intl/server";
import { getShopSettings, waLink } from "@/lib/settings";
import RecontactForm from "./RecontactForm";
import WhatsAppIcon from "./WhatsAppIcon";
import { Phone } from "lucide-react";

// Section "Être recontacté" réutilisable (catalogue + page produit).
export default async function ContactSection() {
  const [t, tOrder, s] = await Promise.all([
    getTranslations("contact"),
    getTranslations("order"),
    getShopSettings(),
  ]);

  const telHref = `tel:${s.phoneNumber.replace(/[^0-9+]/g, "")}`;
  const waGlobal = waLink(s.whatsappNumber, tOrder("whatsappGlobal", { shop: s.businessName }));

  return (
    <section id="contact" style={{ background: "var(--color-ink-soft)", borderTop: "1px solid var(--color-line)" }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-3">{t("eyebrow")}</p>
            <h2 className="text-4xl leading-tight">{t("title")}</h2>
            <p className="mt-5 text-lg" style={{ color: "var(--color-cream-soft)", fontWeight: 300 }}>
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={telHref} className="btn btn-ghost">
                <Phone size={18} /> {s.phoneNumber}
              </a>
              <a href={waGlobal} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                <WhatsAppIcon size={18} /> {t("whatsappLabel")}
              </a>
            </div>
          </div>
          <RecontactForm />
        </div>
      </div>
    </section>
  );
}
