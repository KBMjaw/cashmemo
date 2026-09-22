import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { FileUploader } from '@/components/ui/FileUploader'
import { Select } from '@/components/ui/Input'
import { useMyProfile, useUpdateProfile, useCheckUsernameAvailable } from '@/hooks/useProfile'
import { useImageUpload } from '@/hooks/useImageUpload'
import { STORAGE_BUCKETS, profileUrl } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { usernameSchema } from '@/utils/validation'
import type { ProfileUpdate, ProfileVisibility } from '@/types/database'

interface FormValues {
  full_name: string
  professional_name: string
  professional_title: string
  bio: string
  location: string
  phone: string
  whatsapp: string
  website: string
  username: string
}

export default function ProfileEditor() {
  const { data: profile, isLoading } = useMyProfile()
  const updateProfile = useUpdateProfile()
  const checkUsername = useCheckUsernameAvailable()
  const photoUpload = useImageUpload(STORAGE_BUCKETS.profile)
  const coverUpload = useImageUpload(STORAGE_BUCKETS.cover)

  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>()

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        professional_name: profile.professional_name ?? '',
        professional_title: profile.professional_title ?? '',
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        phone: profile.phone ?? '',
        whatsapp: profile.whatsapp ?? '',
        website: profile.website ?? '',
        username: profile.username,
      })
    }
  }, [profile, reset])

  if (isLoading || !profile) {
    return <div className="text-navy-400">Loading profile…</div>
  }

  async function onSubmit(values: FormValues) {
    setStatus(null)
    setUsernameError(null)

    const parsedUsername = usernameSchema.safeParse(values.username.toLowerCase())
    if (!parsedUsername.success) {
      setUsernameError(parsedUsername.error.issues[0]?.message ?? 'Invalid username')
      return
    }
    if (parsedUsername.data !== profile!.username) {
      const available = await checkUsername(parsedUsername.data, profile!.id)
      if (!available) {
        setUsernameError('That username is already taken')
        return
      }
    }

    const update: ProfileUpdate = {
      full_name: values.full_name,
      professional_name: values.professional_name || null,
      professional_title: values.professional_title || null,
      bio: values.bio || null,
      location: values.location || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      website: values.website || null,
      username: parsedUsername.data,
    }

    try {
      await updateProfile.mutateAsync(update)
      setStatus({ tone: 'success', message: 'Profile updated.' })
    } catch (err) {
      setStatus({ tone: 'error', message: friendlyError(err, 'Your profile could not be saved.') })
    }
  }

  async function handlePhotoSelected(file: File) {
    try {
      const url = await photoUpload.upload(file)
      await updateProfile.mutateAsync({ profile_photo_url: url })
    } catch (err) {
      setStatus({ tone: 'error', message: friendlyError(err) })
    }
  }

  async function handleCoverSelected(file: File) {
    try {
      const url = await coverUpload.upload(file)
      await updateProfile.mutateAsync({ cover_photo_url: url })
    } catch (err) {
      setStatus({ tone: 'error', message: friendlyError(err) })
    }
  }

  async function handleVisibilityChange(visibility: ProfileVisibility) {
    try {
      await updateProfile.mutateAsync({ visibility })
      setStatus({ tone: 'success', message: visibility === 'published' ? 'Your profile is now live.' : 'Visibility updated.' })
    } catch (err) {
      setStatus({ tone: 'error', message: friendlyError(err, 'Your profile could not be published.') })
    }
  }

  async function handlePrivacyToggle(field: 'show_email' | 'show_phone' | 'show_location' | 'search_engine_visible', value: boolean) {
    try {
      await updateProfile.mutateAsync({ [field]: value })
    } catch (err) {
      setStatus({ tone: 'error', message: friendlyError(err) })
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Profile</h1>
        <p className="mt-1 text-sm text-navy-500">
          This is what visitors see at{' '}
          <span className="font-medium text-navy-700">{profileUrl(profile.username)}</span>
        </p>
      </div>

      {status && <Alert tone={status.tone}>{status.message}</Alert>}

      <Card>
        <h2 className="mb-4 font-semibold text-navy-800">Publishing</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={profile.visibility}
            onChange={(e) => handleVisibilityChange(e.target.value as ProfileVisibility)}
            className="sm:max-w-xs"
          >
            <option value="draft">Draft — only I can view</option>
            <option value="published">Published — anyone with the URL can view</option>
            <option value="unpublished">Unpublished — public profile disabled</option>
          </Select>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-navy-800">Photos</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <FileUploader
            shape="circle"
            previewUrl={profile.profile_photo_url}
            uploading={photoUpload.uploading}
            error={photoUpload.error}
            hint="Profile photo — JPG, PNG or WEBP, max 5MB"
            onFileSelected={handlePhotoSelected}
          />
          <FileUploader
            previewUrl={profile.cover_photo_url}
            uploading={coverUpload.uploading}
            error={coverUpload.error}
            hint="Cover photo (optional) — recommended ratio 16:9"
            onFileSelected={handleCoverSelected}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-navy-800">Personal Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Username"
            required
            hint="onetap.com/u/username"
            error={usernameError ?? undefined}
            {...register('username', { required: 'Username is required' })}
          />
          <Input label="Full Name" required error={errors.full_name?.message} {...register('full_name', { required: 'Full name is required' })} />
          <Input label="Professional Name" hint="Shown instead of your full name if set" {...register('professional_name')} />
          <Input label="Professional Title" placeholder="Founder & CEO" {...register('professional_title')} />
          <Textarea label="Short Bio" placeholder="Tell visitors who you are" {...register('bio')} />
          <Input label="Location" placeholder="Chennai, India" {...register('location')} />
          <Input label="Phone" type="tel" {...register('phone')} />
          <Input label="WhatsApp" type="tel" {...register('whatsapp')} />
          <Input label="Website" type="url" placeholder="https://" {...register('website')} />

          <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="self-start">
            Save changes
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-navy-800">Privacy</h2>
        <div className="flex flex-col gap-4">
          <Toggle
            label="Show email publicly"
            description="Your login email stays private unless you enable this"
            checked={profile.show_email}
            onChange={(v) => handlePrivacyToggle('show_email', v)}
          />
          <Toggle
            label="Show phone publicly"
            checked={profile.show_phone}
            onChange={(v) => handlePrivacyToggle('show_phone', v)}
          />
          <Toggle
            label="Show location publicly"
            checked={profile.show_location}
            onChange={(v) => handlePrivacyToggle('show_location', v)}
          />
          <Toggle
            label="Search engine visibility"
            description="Allow Google and other search engines to index your profile"
            checked={profile.search_engine_visible}
            onChange={(v) => handlePrivacyToggle('search_engine_visible', v)}
          />
          <p className="text-xs text-navy-400">Your date of birth is never shown on your public profile.</p>
        </div>
      </Card>
    </div>
  )
}
