'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Play, Pause, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { MAX_ATTACHMENT_SIZE } from '@/lib/storage/upload-attachment'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  pharmacyId: string
  folderPath: string // e.g. "tasks/123"
  onUploaded: (path: string) => void
  existingPath?: string | null
  onDelete?: () => void
  readOnly?: boolean
}

export function AudioRecorder({
  pharmacyId,
  folderPath,
  onUploaded,
  existingPath,
  onDelete,
  readOnly = false
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [audioPath, setAudioPath] = useState<string | null>(existingPath ?? null)
  const { data: audioSignedUrl } = useSignedUrl('attachments', audioPath ?? undefined)
  const [uploading, setUploading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (existingPath) setAudioPath(existingPath)
  }, [existingPath])

  // <audio> ne refresh pas automatiquement quand src change après le premier
  // render (cas typique : audioSignedUrl arrive après mount). Forcer load().
  useEffect(() => {
    if (audioSignedUrl && audioRef.current) {
      audioRef.current.load()
    }
  }, [audioSignedUrl])

  useEffect(() => {
    return () => {
      stopStream()
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current)
    }
  }, [])

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const file = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: mimeType })
        await handleUpload(file)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordTime(0)

      recordIntervalRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1)
      }, 1000)

    } catch {
      toast.error("Accès au microphone refusé ou indisponible")
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

  const handleUpload = async (file: File) => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error('Le mémo vocal est trop volumineux (max 10 Mo)')
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `${pharmacyId}/${folderPath}/${file.name}`

      const { error } = await supabase.storage
        .from('attachments')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      setAudioPath(path)
      onUploaded(path)
      toast.success("Message vocal enregistré")
    } catch (error) {
      const message = error instanceof Error ? error.message : null
      toast.error(message || "Erreur lors de l'upload audio")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = () => {
    setAudioPath(null)
    setRecordTime(0)
    if (onDelete) onDelete()
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (audioPath) {
    const WaveBars = ({ animate }: { animate: boolean }) => (
      <div className="flex items-center gap-[3px] h-5 px-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-slate-400"
            style={{
              height: animate
                ? undefined
                : `${4 + Math.abs(3.5 - i) * 2.5}px`,
              animation: animate
                ? `waveBar 0.8s ease-in-out ${i * 0.08}s infinite alternate`
                : undefined,
            }}
          />
        ))}
        <style>{`
          @keyframes waveBar {
            0%   { height: 4px; }
            100% { height: 18px; }
          }
        `}</style>
      </div>
    )

    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1.5 pr-3 w-max">
        <audio
          ref={audioRef}
          src={audioSignedUrl ?? undefined}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        <Button 
          type="button" 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full shrink-0" 
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <WaveBars animate={isPlaying} />
        {onDelete && !readOnly && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" 
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )
  }

  if (readOnly) return null;

  if (uploading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 w-max">
        <Loader2 className="h-4 w-4 animate-spin" />
        Enregistrement...
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <div className="flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-4 py-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600 w-12">{formatTime(recordTime)}</span>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-red-700 hover:text-red-800 hover:bg-red-100" 
            onClick={stopRecording}
          >
            <Square className="h-3.5 w-3.5 mr-1" />
            Stop
          </Button>
        </div>
      ) : (
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="rounded-full" 
          onClick={startRecording}
        >
          <Mic className="h-4 w-4 mr-2" />
          Ajouter un mémo vocal
        </Button>
      )}
    </div>
  )
}
