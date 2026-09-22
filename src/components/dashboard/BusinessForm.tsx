import { useForm } from 'react-hook-form'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FileUploader } from '@/components/ui/FileUploader'
import { useImageUpload } from '@/hooks/useImageUpload'
import { STORAGE_BUCKETS } from '@/lib/supabase'
import type { Business, BusinessInput } from '@/types/database'

interface BusinessFormProps {
  initial?: Business
  onSubmit: (values: BusinessInput) => Promise<void>
  submitLabel?: string
}

type FormValues = {
  name: string
  designation: string
  description: string
  website: string
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  state: string
  country: string
  maps_url: string
  linkedin_url: string
  instagram_url: string
  facebook_url: string
  youtube_url: string
  founded_year: string
  industry: string
  services: string
}

export function BusinessForm({ initial, onSubmit, submitLabel = 'Save business' }: BusinessFormProps) {
  const logoUpload = useImageUpload(STORAGE_BUCKETS.logo)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      designation: initial?.designation ?? '',
      description: initial?.description ?? '',
      website: initial?.website ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      whatsapp: initial?.whatsapp ?? '',
      address: initial?.address ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
      country: initial?.country ?? '',
      maps_url: initial?.maps_url ?? '',
      linkedin_url: initial?.linkedin_url ?? '',
      instagram_url: initial?.instagram_url ?? '',
      facebook_url: initial?.facebook_url ?? '',
      youtube_url: initial?.youtube_url ?? '',
      founded_year: initial?.founded_year ? String(initial.founded_year) : '',
      industry: initial?.industry ?? '',
      services: initial?.services?.join(', ') ?? '',
    },
  })

  const logoUrl = watch('__logo_url' as never) as unknown as string | undefined

  async function submit(values: FormValues) {
    const payload: BusinessInput = {
      name: values.name,
      designation: values.designation || null,
      description: values.description || null,
      website: values.website || null,
      email: values.email || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      country: values.country || null,
      maps_url: values.maps_url || null,
      linkedin_url: values.linkedin_url || null,
      instagram_url: values.instagram_url || null,
      facebook_url: values.facebook_url || null,
      youtube_url: values.youtube_url || null,
      founded_year: values.founded_year ? Number(values.founded_year) : null,
      industry: values.industry || null,
      services: values.services
        ? values.services.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      logo_url: logoUrl ?? initial?.logo_url ?? null,
      cover_image_url: initial?.cover_image_url ?? null,
      is_primary: initial?.is_primary ?? false,
      sort_order: initial?.sort_order ?? 0,
    }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <FileUploader
        shape="circle"
        previewUrl={logoUrl ?? initial?.logo_url}
        uploading={logoUpload.uploading}
        error={logoUpload.error}
        hint="Business logo"
        onFileSelected={async (file) => {
          const url = await logoUpload.upload(file)
          setValue('__logo_url' as never, url as never)
        }}
      />

      <Input label="Business Name" required error={errors.name?.message} {...register('name', { required: 'Business name is required' })} />
      <Input label="Your Designation" placeholder="Founder & CEO" {...register('designation')} />
      <Textarea label="Business Description" {...register('description')} />
      <Input label="Industry" placeholder="Manufacturing, IT Services…" {...register('industry')} />
      <Input label="Founded Year" type="number" min={1800} max={2100} {...register('founded_year')} />
      <Input label="Services" hint="Comma separated" placeholder="Consulting, Design, Development" {...register('services')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Website" type="url" placeholder="https://" {...register('website')} />
        <Input label="Business Email" type="email" {...register('email')} />
        <Input label="Business Phone" type="tel" {...register('phone')} />
        <Input label="WhatsApp" type="tel" {...register('whatsapp')} />
      </div>

      <Input label="Address" {...register('address')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="City" {...register('city')} />
        <Input label="State" {...register('state')} />
        <Input label="Country" {...register('country')} />
      </div>
      <Input label="Google Maps URL" type="url" {...register('maps_url')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="LinkedIn" type="url" {...register('linkedin_url')} />
        <Input label="Instagram" type="url" {...register('instagram_url')} />
        <Input label="Facebook" type="url" {...register('facebook_url')} />
        <Input label="YouTube" type="url" {...register('youtube_url')} />
      </div>

      <Button type="submit" loading={isSubmitting} className="self-start">
        {submitLabel}
      </Button>
    </form>
  )
}
