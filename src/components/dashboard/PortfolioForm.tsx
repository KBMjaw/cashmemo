import { useForm } from 'react-hook-form'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FileUploader } from '@/components/ui/FileUploader'
import { useImageUpload } from '@/hooks/useImageUpload'
import { STORAGE_BUCKETS } from '@/lib/supabase'
import type { PortfolioInput, PortfolioItem } from '@/types/database'

interface PortfolioFormProps {
  initial?: PortfolioItem
  onSubmit: (values: PortfolioInput) => Promise<void>
  submitLabel?: string
}

type FormValues = {
  title: string
  description: string
  website_url: string
  category: string
  skills: string
  start_date: string
  end_date: string
}

export function PortfolioForm({ initial, onSubmit, submitLabel = 'Save project' }: PortfolioFormProps) {
  const coverUpload = useImageUpload(STORAGE_BUCKETS.portfolio)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      website_url: initial?.website_url ?? '',
      category: initial?.category ?? '',
      skills: initial?.skills?.join(', ') ?? '',
      start_date: initial?.start_date ?? '',
      end_date: initial?.end_date ?? '',
    },
  })

  const coverUrl = watch('__cover_url' as never) as unknown as string | undefined

  async function submit(values: FormValues) {
    await onSubmit({
      title: values.title,
      description: values.description || null,
      website_url: values.website_url || null,
      category: values.category || null,
      skills: values.skills ? values.skills.split(',').map((s) => s.trim()).filter(Boolean) : null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      cover_image_url: coverUrl ?? initial?.cover_image_url ?? null,
      sort_order: initial?.sort_order ?? 0,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <FileUploader
        previewUrl={coverUrl ?? initial?.cover_image_url}
        uploading={coverUpload.uploading}
        error={coverUpload.error}
        hint="Cover image"
        onFileSelected={async (file) => {
          const url = await coverUpload.upload(file)
          setValue('__cover_url' as never, url as never)
        }}
      />
      <Input label="Project Name" required error={errors.title?.message} {...register('title', { required: 'Project name is required' })} />
      <Textarea label="Description" {...register('description')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Website / Project URL" type="url" placeholder="https://" {...register('website_url')} />
        <Input label="Category" placeholder="AI, Web App, Mobile…" {...register('category')} />
      </div>
      <Input label="Skills / Technologies" hint="Comma separated" {...register('skills')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start Date" type="date" {...register('start_date')} />
        <Input label="End Date" type="date" {...register('end_date')} />
      </div>
      <Button type="submit" loading={isSubmitting} className="self-start">
        {submitLabel}
      </Button>
    </form>
  )
}
