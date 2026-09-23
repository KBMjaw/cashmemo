import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useImageUpload(bucket: string) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File): Promise<string> {
    setError(null)
    if (!user) throw new Error('Not authenticated')
    if (!ALLOWED_TYPES.includes(file.type)) {
      const message = 'Please upload a JPG, PNG or WEBP image.'
      setError(message)
      throw new Error(message)
    }
    if (file.size > MAX_SIZE_BYTES) {
      const message = 'Image size must be less than 5 MB.'
      setError(message)
      throw new Error(message)
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}
