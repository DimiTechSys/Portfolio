'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_LABELS } from '@/config/constants'
import { updateProfile } from '@/lib/queries/profiles'
import type { UserRole } from '@/types/index'
import { useProfile } from '@/contexts/profile-context'
import { toast } from 'sonner'
import { ArrowLeft, Save, User, Camera, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import Image from 'next/image'

export function ProfileForm() {
  const router = useRouter()
  const { profile, refetch } = useProfile()
  
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  // Source de vérité = profile.avatar_url (DB). Le hook re-signe automatiquement
  // quand refetch() met à jour profile après upload, pas besoin de state local.
  const avatarPath = profile?.avatar_url || ''
  const { data: avatarSignedUrl } = useSignedUrl('attachments', avatarPath || undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!profile) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      display_name: displayName.trim() || null,
      avatar_url: avatarPath || null,
    }

    const { error } = await updateProfile(profile.id, payload)
    
    if (error) {
      toast.error('Erreur lors de la mise à jour du profil')
      setIsSubmitting(false)
      return
    }

    await refetch()
    toast.success('Modifications enregistrées')
    setIsSubmitting(false)
    router.push('/dashboard')
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5 MB)")
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const pharmacyId = profile.pharmacy_id || 'unassigned'
      const path = `${pharmacyId}/avatars/${profile.id}_${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from('attachments')
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      // Auto-save the avatar directly. refetch() met à jour profile.avatar_url
      // → avatarPath dérivé re-render → useSignedUrl signe la nouvelle URL.
      await updateProfile(profile.id, { avatar_url: path })
      await refetch()
      
      toast.success('Photo de profil mise à jour')
    } catch (error) {
      const message = error instanceof Error ? error.message : null
      toast.error(message || "Erreur lors de l'upload de l'image")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const roleLabel = profile.role
    ? ROLE_LABELS[profile.role as UserRole] ?? profile.role
    : 'Utilisateur'

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mon profil</h1>
          <p className="text-sm text-slate-500">Gérez vos informations personnelles.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*,.heic,.heif" 
            />
            <button 
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 overflow-hidden border-2 border-white shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {avatarSignedUrl ? (
                <Image src={avatarSignedUrl} alt="Avatar" fill className="object-cover" sizes="96px" />
              ) : (
                <User size={36} />
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </button>
          </div>
          
          <div className="text-center sm:text-left sm:pt-2">
            <h2 className="text-lg font-semibold text-slate-900">{profile.display_name || 'Utilisateur'}</h2>
            <div className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {roleLabel}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Inscrit depuis le {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at))}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-slate-700">Prénom</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Jean"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-slate-700">Nom</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Dupont"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-slate-700">Nom d&apos;affichage</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: J. Dupont"
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-4 focus:bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">C&apos;est ce nom qui sera visible par les autres membres de la pharmacie.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-full bg-teal-600 px-6 hover:bg-teal-700"
            >
              {isSubmitting ? (
                'Enregistrement...'
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
