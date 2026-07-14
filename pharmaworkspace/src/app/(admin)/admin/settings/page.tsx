import { PharmacySettingsForm } from '@/components/admin/pharmacy-settings-form'
import { GeofencingSettingsForm } from '@/components/admin/geofencing-settings-form'
import { BillingSettingsForm } from '@/components/admin/billing-settings-form'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres de l&apos;officine</h1>
        <p className="text-sm text-muted-foreground">
          Configurez les informations de votre pharmacie et votre abonnement.
        </p>
      </div>

      <div className="grid w-full gap-4 md:gap-6 lg:grid-cols-2">
        <PharmacySettingsForm />
        <GeofencingSettingsForm />
      </div>
      <div className="w-full">
        <BillingSettingsForm />
      </div>
    </div>
  )
}
