import { useRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/ui/Spinner'

interface FileUploaderProps {
  onFileSelected: (file: File) => void | Promise<void>
  uploading?: boolean
  error?: string | null
  accept?: string
  hint?: string
  previewUrl?: string | null
  shape?: 'circle' | 'rounded'
  className?: string
}

export function FileUploader({
  onFileSelected,
  uploading,
  error,
  accept = 'image/jpeg,image/png,image/webp',
  hint = 'JPG, PNG or WEBP. Max 5 MB.',
  previewUrl,
  shape = 'rounded',
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        className={cn(
          'relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-navy-200 bg-navy-50 transition-colors hover:border-brand-400',
          shape === 'circle' ? 'h-28 w-28 rounded-full' : 'h-36 w-full rounded-xl2',
          dragActive && 'border-brand-500 bg-brand-50',
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 text-center text-navy-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium">Click or drag to upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Spinner className="h-6 w-6 text-brand-600" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : hint && <p className="text-xs text-navy-400">{hint}</p>}
    </div>
  )
}
