import { MissionsPreferenceForm } from '@/components/profile/missions-preference-form'

export const metadata = {
  title: 'Mes préférences - PharmaWorkspace',
  description: 'Personnalisez votre expérience PharmaWorkspace',
}

export default function ProfilePreferencesPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes préférences</h1>
        <p className="text-sm text-muted-foreground">
          Personnalisez votre expérience PharmaWorkspace. Ces réglages sont
          propres à votre compte.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-4 md:space-y-6">
        <MissionsPreferenceForm />
      </div>
    </div>
  )
}
