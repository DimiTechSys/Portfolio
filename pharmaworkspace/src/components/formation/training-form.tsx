'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video, FileText, Link as LinkIcon } from 'lucide-react'
import { TrainingUploadRecorder } from './training-upload-recorder'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import { cn } from '@/lib/utils'
import type { TrainingResource } from '@/types/index'

const trainingResourceSchema = z.object({
  title: z.string().min(2, "Le titre doit faire au moins 2 caractères").max(100),
  description: z.string().max(300).optional(),
  type: z.enum(['video', 'memo']),
  source: z.enum(['url', 'upload']),
  url: z.string().url("Veuillez entrer une URL valide").optional().or(z.literal('')),
  storage_path: z.string().optional(),
  duration_minutes: z.coerce.number().min(0).optional(),
  is_published: z.boolean().default(false),
  order_index: z.number().default(0),
}).refine((data) => {
  if (data.source === 'url' && !data.url) return false
  if (data.source === 'upload' && !data.storage_path) return false
  return true
}, {
  message: "La source du contenu est obligatoire",
  path: ["url"]
})

type TrainingResourceFormValues = z.infer<typeof trainingResourceSchema>

interface TrainingFormProps {
  open: boolean
  onClose: () => void
  resource?: TrainingResource
  onSave: (data: Omit<TrainingResource, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  pharmacyId: string
  profileId: string
}

export function TrainingForm({
  open,
  onClose,
  resource,
  onSave,
  pharmacyId,
  profileId,
}: TrainingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TrainingResourceFormValues>({
    resolver: zodResolver(trainingResourceSchema) as unknown as Resolver<TrainingResourceFormValues>,
    defaultValues: {
      type: 'video',
      source: 'url',
      is_published: false,
      order_index: 0,
      title: '',
      description: '',
      url: '',
      storage_path: '',
      duration_minutes: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (resource) {
        form.reset({
          title: resource.title,
          description: resource.description || '',
          type: resource.type,
          source: resource.storage_path ? 'upload' : 'url',
          url: resource.url || '',
          storage_path: resource.storage_path || '',
          duration_minutes: resource.duration_minutes || 0,
          is_published: resource.is_published,
          order_index: resource.order_index,
        })
      } else {
        form.reset({
          type: 'video',
          source: 'url',
          is_published: false,
          order_index: 0,
          title: '',
          description: '',
          url: '',
          storage_path: '',
          duration_minutes: 0,
        })
      }
    }
  }, [resource, form, open])

  const onSubmit = async (values: TrainingResourceFormValues) => {
    setIsSubmitting(true)
    try {
      const { source, ...rest } = values
      const payload = {
        pharmacy_id: pharmacyId,
        created_by: profileId,
        title: rest.title,
        description: rest.description || undefined,
        type: rest.type,
        url: source === 'url' ? (rest.url?.trim() || null) : null,
        storage_path: source === 'upload' ? (rest.storage_path || null) : null,
        is_published: rest.is_published,
        order_index: rest.order_index,
      } as Omit<TrainingResource, 'id' | 'created_at' | 'updated_at'>
      await onSave(payload)
      onClose()
    } catch {
      // toast is handled by hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = form.watch('type')
  const selectedSource = form.watch('source')

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={resource ? "Modifier la ressource" : "Nouvelle ressource"}
      subtitle="Partagez du savoir avec l'équipe pour une meilleure efficacité."
      width="lg"
      actions={
        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="training-form"
            disabled={isSubmitting}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Enregistrement…' : resource ? 'Mettre à jour' : 'Partager'}
          </button>
        </div>
      }
    >
      <Form {...form}>
        <form
          id="training-form"
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit(onSubmit)()
          }}
          className="p-4 md:p-6 space-y-6"
        >
          {/* Field: Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Type de ressource</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-3"
                  >
                    <FormItem className="flex-1">
                      <FormControl>
                        <RadioGroupItem value="video" className="sr-only" />
                      </FormControl>
                      <FormLabel className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                        field.value === 'video' 
                          ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      )}>
                        <div className={cn("rounded-lg p-1.5", field.value === 'video' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400")}>
                          <Video className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Vidéo</p>
                          <p className="text-[10px] text-slate-400">YouTube, interne...</p>
                        </div>
                      </FormLabel>
                    </FormItem>

                    <FormItem className="flex-1">
                      <FormControl>
                        <RadioGroupItem value="memo" className="sr-only" />
                      </FormControl>
                      <FormLabel className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                        field.value === 'memo' 
                          ? "bg-green-50 border-green-200 ring-1 ring-green-100" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      )}>
                        <div className={cn("rounded-lg p-1.5", field.value === 'memo' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400")}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Mémo</p>
                          <p className="text-[10px] text-slate-400">PDF, Image...</p>
                        </div>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Prise en main des ordonnances" {...field} className="rounded-xl border-slate-200 bg-slate-50/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Courte description du contenu..." 
                      className="rounded-xl border-slate-200 bg-slate-50/50 resize-none" 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Content Source Section */}
          <div className="space-y-4 rounded-3xl bg-slate-50/50 border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Contenu de la ressource</span>
              <Tabs value={selectedSource} onValueChange={(v) => form.setValue('source', v as 'url' | 'upload')} className="w-auto">
                <TabsList className="bg-slate-200/50 rounded-lg p-1 h-8">
                  <TabsTrigger value="url" className="text-[10px] rounded-md h-6 px-3">Lien externe</TabsTrigger>
                  <TabsTrigger value="upload" className="text-[10px] rounded-md h-6 px-3">
                    {selectedType === 'video' ? 'Enregistrer / Uploader' : 'Uploader'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {selectedSource === 'url' ? (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder={
                            selectedType === 'video'
                              ? "https://youtube.com/watch?v=..."
                              : "https://lien-vers-votre-document.com/fichier"
                          }
                          className="pl-10 rounded-xl border-slate-200 bg-white" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    {selectedType === 'video' && field.value && (field.value.includes('youtube.com') || field.value.includes('youtu.be')) && (
                      <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                         <Image
                           src={`https://img.youtube.com/vi/${field.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)?.[1] || ''}/mqdefault.jpg`}
                           alt="YouTube Preview"
                           fill
                           sizes="(max-width: 768px) 100vw, 480px"
                           className="object-cover"
                           onError={(e) => (e.currentTarget.style.display = 'none')}
                         />
                      </div>
                    )}
                    <FormDescription className="text-[10px]">
                      {selectedType === 'video'
                        ? 'Compatible : YouTube, Loom, Vimeo'
                        : 'Lien vers PDF, PowerPoint, Word, image ou document hébergé'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-2">
                 {form.watch('storage_path') ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                           {selectedType === 'video' ? (
                             <Video size={14} />
                           ) : (
                             <FileText size={14} />
                           )}
                         </div>
                         <div className="min-w-0">
                           <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                             {form.watch('storage_path')?.split('/').pop() || (selectedType === 'video' ? 'Vidéo prête ✓' : 'Fichier prêt ✓')}
                           </p>
                           <p className="text-[10px] text-slate-400">Ressource interne enregistrée</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          form.setValue('storage_path', '')
                          form.setValue('duration_minutes', 0)
                        }}
                        className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                      >
                        Remplacer
                      </button>
                    </div>

                    <TrainingStoragePreview
                      storagePath={form.watch('storage_path') || ''}
                      type={selectedType}
                    />

                  </div>
                 ) : (
                   <TrainingUploadRecorder
                     type={selectedType}
                     pharmacyId={pharmacyId} 
                     onUploaded={(path, duration) => {
                       form.setValue('storage_path', path)
                       if (duration) form.setValue('duration_minutes', duration)
                     }}
                   />
                 )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex h-full items-end pb-3 md:col-span-2">
                  <FormControl>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 w-full">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-teal-600"
                      />
                      <div className="space-y-0.5 pointer-events-none">
                        <p className="text-xs font-bold text-slate-800">Publier immédiatement</p>
                        <p className="text-[10px] text-slate-400">Rendre visible pour toute l&apos;équipe</p>
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

        </form>
      </Form>
    </DetailDrawer>
  )
}

function TrainingStoragePreview({ storagePath, type }: { storagePath: string; type: 'video' | 'memo' }) {
  const { data: signedUrl } = useSignedUrl('training-files', storagePath || undefined)
  if (!storagePath) return null

  const isImage = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(storagePath)

  if (isImage && signedUrl) {
    return (
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Image
          src={signedUrl}
          alt="Aperçu"
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-contain"
        />
      </div>
    )
  }

  if (type === 'video' && signedUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
        <video src={signedUrl} className="aspect-video w-full object-contain" controls />
      </div>
    )
  }

  return null
}
