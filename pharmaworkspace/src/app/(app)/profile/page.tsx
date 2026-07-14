import { ProfileForm } from '@/components/profile/profile-form'
import { PrivacySection } from '@/components/profile/privacy-section'

export const metadata = {
  title: 'Mon profil - PharmaWorkspace',
  description: 'Gérez vos informations personnelles',
}

export default function ProfilePage() {
  return (
    <div className="pb-12">
      <ProfileForm />
      <PrivacySection />
    </div>
  )
}
