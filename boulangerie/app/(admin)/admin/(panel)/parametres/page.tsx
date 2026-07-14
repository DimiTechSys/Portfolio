import { getShopSettings } from "@/lib/settings";
import { saveSettingsAction } from "@/app/actions/admin";
import PasswordForm from "./PasswordForm";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const s = await getShopSettings();

  return (
    <div>
      <h1 className="text-3xl mb-1">Paramètres</h1>
      <p className="mb-8" style={{ color: "var(--color-muted)" }}>
        Ces informations alimentent la vitrine et les boutons de contact.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form action={saveSettingsAction} className="card p-6">
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Enseigne &amp; contact
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Nom de l'enseigne</label>
              <input name="businessName" className="field" defaultValue={s.businessName} required />
            </div>
            <div>
              <label className="label">Accroche (affichée sur le héros)</label>
              <textarea name="tagline" className="field" rows={2} defaultValue={s.tagline} />
            </div>
            <div>
              <label className="label">Ville</label>
              <input name="city" className="field" defaultValue={s.city} />
            </div>
            <div>
              <label className="label">Numéro WhatsApp (format international, sans +)</label>
              <input name="whatsappNumber" className="field" defaultValue={s.whatsappNumber} placeholder="213555000000" />
              <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                Exemple : 213555000000 (213 = indicatif Algérie).
              </p>
            </div>
            <div>
              <label className="label">Téléphone affiché</label>
              <input name="phoneNumber" className="field" defaultValue={s.phoneNumber} placeholder="+213 555 00 00 00" />
            </div>
          </div>
          <button type="submit" className="btn btn-gold mt-5">
            Enregistrer
          </button>
        </form>

        <PasswordForm />
      </div>
    </div>
  );
}
