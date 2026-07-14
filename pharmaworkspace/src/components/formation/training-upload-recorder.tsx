'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Video, StopCircle, RefreshCcw, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { buildTrainingStorageObjectKey } from '@/lib/queries/training'
interface TrainingUploadRecorderProps {
  onUploaded: (storagePath: string, durationMinutes?: number) => void
  pharmacyId: string
  type: 'video' | 'memo'
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

/** Extensions + MIME pour le sélecteur de fichiers (Windows filtre mieux avec extensions explicites). */
const MEMO_FILE_ACCEPT =
  '.pdf,application/pdf,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif,image/*'

export function TrainingUploadRecorder({
  onUploaded,
  pharmacyId,
  type
}: TrainingUploadRecorderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>(type === 'video' ? 'upload' : 'upload')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordTime, setRecordTime] = useState(0)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  useEffect(() => {
    return () => {
      stopStream()
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current)
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [stopStream, previewUrl])

  useEffect(() => {
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
      }
    }
  }, [file])

  // --- UPLOAD LOGIC ---
  const handleFileUpload = async (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Le fichier est trop volumineux (max 500 MB)")
      return
    }

    const acceptedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const acceptedMemoTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
    ]
    
    if (type === 'video' && !acceptedVideoTypes.includes(selectedFile.type)) {
      toast.error("Format vidéo non supporté (MP4, WebM, MOV uniquement)")
      return
    }
    
    const isMemoAcceptedByExtension =
      type === 'memo' &&
      /\.(pdf|doc|docx|ppt|pptx|heic|heif)$/i.test(selectedFile.name)
    if (
      type === 'memo' &&
      !acceptedMemoTypes.includes(selectedFile.type) &&
      !isMemoAcceptedByExtension
    ) {
      toast.error("Formats acceptés: PDF, PowerPoint, Word, JPG, PNG, WEBP, GIF, HEIC")
      return
    }

    setFile(selectedFile)
    setUploading(true)
    setProgress(0)

    try {
      const supabase = createClient()
      const path = buildTrainingStorageObjectKey(pharmacyId, type, selectedFile.name)

      // We use a manual progress tracking if possible, or just standard upload
      const { error } = await supabase.storage
        .from('training-files')
        .upload(path, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      setUploading(false)
      setIsSuccess(true)
      setProgress(100)
      
      // Calculate duration if it's a video
      const durationMinutes = 0
      if (type === 'video') {
         // Rough estimation or set manually later. For now, leave it to user or try metadata.
      }
      
      onUploaded(path, durationMinutes)
    } catch (error) {
      setUploading(false)
      const message = error instanceof Error ? error.message : null
      toast.error(message || "Erreur lors de l'upload")
    }
  }

  // --- RECORDING LOGIC ---
  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      setStream(mediaStream)
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream
      }

      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setRecordedBlob(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordTime(0)
      
      recordIntervalRef.current = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 29 * 60) {
            toast.warning("Limite de 30 minutes bientôt atteinte")
          }
          if (prev >= 30 * 60) {
            stopRecording()
          }
          return prev + 1
        })
      }, 1000)

    } catch {
      toast.error("Accès à la caméra ou au micro refusé")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current)
      stopStream()
    }
  }

  const handleUseRecording = async () => {
    if (!recordedBlob) return
    const recordFile = new File([recordedBlob], `recording_${Date.now()}.webm`, { type: 'video/webm' })
    
    // We get duration from recordTime
    const _duration = Math.ceil(recordTime / 60)

    await handleFileUpload(recordFile)
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordTime(0)
    setIsSuccess(false)
    setFile(null)
  }

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'record')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger 
            value="upload" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <Upload size={14} className="mr-2" />
            Uploader
          </TabsTrigger>
          {type === 'video' && (
            <TabsTrigger 
              value="record" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
            >
              <Video size={14} className="mr-2" />
              Enregistrer
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upload" className="mt-4 outline-none">
          {!file ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
              }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center transition-all hover:border-teal-400 hover:bg-teal-50/30"
            >
              <div className="pointer-events-none flex flex-col items-center px-2">
                <div className="mb-4 rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-200 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-teal-600" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Glissez votre fichier ici
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {type === 'video'
                    ? 'MP4, WebM ou MOV jusqu\'à 500 MB'
                    : 'PDF, PowerPoint, Word ou image jusqu\'à 500 MB'}
                </p>
              </div>
              <input
                type="file"
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                aria-label="Choisir un fichier"
                accept={
                  type === 'video'
                    ? 'video/mp4,video/webm,video/quicktime'
                    : MEMO_FILE_ACCEPT
                }
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </div>
          ) : (
              <div className="flex flex-col gap-4">
                {previewUrl && (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {file?.type.startsWith('video/') ? (
                      <video src={previewUrl} className="aspect-video w-full object-contain" controls />
                    ) : (
                      // Preview locale (blob: URL) avant upload : Next/Image ne traite
                      // pas les blob:, on garde <img> volontairement.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Preview" className="max-h-48 w-full object-contain" />
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-50 p-2">
                      {isSuccess ? <CheckCircle className="h-4 w-4 text-teal-600" /> : <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  {!uploading && (
                    <button 
                      onClick={() => { setFile(null); setIsSuccess(false); setPreviewUrl(null); }}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-[10px] text-center text-slate-500 font-medium">Upload en cours... {progress > 0 && `${progress}%`}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="rounded-xl bg-teal-600/10 p-2 text-center border border-teal-600/20">
                    <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Fichier prêt ✓</p>
                  </div>
                )}
              </div>
          )}
        </TabsContent>

        {type === 'video' && (
          <TabsContent value="record" className="mt-4 outline-none">
            {!recordedBlob ? (
              <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-slate-800">
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
                  {isRecording ? (
                    <video 
                      ref={videoPreviewRef} 
                      autoPlay 
                      muted 
                      className="absolute inset-0 h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="text-center text-slate-500 font-medium text-sm px-6">
                      <Video size={40} className="mx-auto mb-3 opacity-20" />
                      L&apos;enregistrement sera stocké en toute sécurité dans l&apos;officine.
                    </div>
                  )}

                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-[10px] font-bold text-white shadow-lg animate-pulse backdrop-blur-sm">
                      <div className="h-2 w-2 rounded-full bg-white" />
                      EN DIRECT · {formatTime(recordTime)}
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg hover:bg-white active:scale-95 transition-all"
                    >
                      <StopCircle size={18} className="text-red-600" />
                      Arrêter
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 active:scale-95 transition-all"
                    >
                      <Video size={18} />
                      Démarrer
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-slate-800">
                    <video 
                      src={URL.createObjectURL(recordedBlob)} 
                      controls 
                      className="aspect-video w-full object-contain" 
                    />
                 </div>
                 
                 {isSuccess ? (
                    <div className="rounded-2xl bg-teal-50 border border-teal-100 p-4 text-center">
                       <CheckCircle size={24} className="mx-auto mb-2 text-teal-600" />
                       <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Vidéo enregistrée avec succès ✓</p>
                    </div>
                 ) : (
                   <div className="flex items-center gap-3">
                     <button
                       onClick={resetRecording}
                       className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all"
                     >
                       <RefreshCcw size={16} />
                       Recommencer
                     </button>
                     <button
                       disabled={uploading}
                       onClick={handleUseRecording}
                       className="flex-[1.5] inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-black disabled:opacity-50"
                     >
                       {uploading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                       Utiliser cet enregistrement
                     </button>
                   </div>
                 )}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Constraints Warning */}
      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500 border border-slate-100">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-slate-400" />
        <p>
          Toutes les ressources sont hébergées en France et conformes au RGPD. 
          Les vidéos sont limitées à 30 minutes ou 500 MB.
        </p>
      </div>
    </div>
  )
}
