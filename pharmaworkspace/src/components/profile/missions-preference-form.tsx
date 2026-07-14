'use client'

// Toggle "Afficher le widget des missions" — visible par TOUS les membres
// depuis la migration 0060 (per-user flag sur profiles.missions_dismissed_at).
// Référencé par la modal de dismiss du widget de missions.

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Eye } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { createClient } from '@/lib/supabase/client'
import { setMissionsDismissed } from '@/lib/queries/onboarding'

export function MissionsPreferenceForm() {
  const { profile } = useProfile()
  const [missionsVisible, setMissionsVisible] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    const supabase = createClient()
    void supabase
      .from('profiles')
      .select('missions_dismissed_at')
      .eq('id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        setMissionsVisible(!data?.missions_dismissed_at)
      })
  }, [profile?.id])

  async function handleToggle(visible: boolean) {
    if (!profile?.id) return
    setSaving(true)
    const previous = missionsVisible
    setMissionsVisible(visible)
    const result = await setMissionsDismissed(profile.id, !visible)
    setSaving(false)
    if (result.error) {
      setMissionsVisible(previous)
      toast.error(result.error)
      return
    }
    toast.success('Modifications enregistrées')
  }

  return (
    <Card id="display">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Affichage du tableau de bord
        </CardTitle>
        <CardDescription>
          Personnalisez les éléments affichés sur votre tableau de bord. Ces
          préférences sont propres à votre compte et n&apos;affectent pas vos
          collègues.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="missions-toggle" className="text-sm">
              Missions d&apos;activation
            </Label>
            <p className="text-xs text-muted-foreground">
              Le widget guide votre prise en main de PharmaWorkspace pendant
              vos premiers jours.
            </p>
          </div>
          <Switch
            id="missions-toggle"
            checked={missionsVisible ?? false}
            disabled={missionsVisible === null || saving}
            onCheckedChange={(checked) => void handleToggle(checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
