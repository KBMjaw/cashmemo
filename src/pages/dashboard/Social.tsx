import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import {
  useSocialLinks,
  useCreateSocialLink,
  useUpdateSocialLink,
  useDeleteSocialLink,
  useReorderSocialLinks,
} from '@/hooks/useSocialLinks'
import { SOCIAL_PLATFORMS, type SocialPlatform } from '@/types/database'
import { friendlyError } from '@/lib/errors'

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  github: 'GitHub',
  threads: 'Threads',
  telegram: 'Telegram',
  pinterest: 'Pinterest',
}

type FormValues = { platform: SocialPlatform; url: string }

export default function Social() {
  const { data: links = [], isLoading } = useSocialLinks()
  const createLink = useCreateSocialLink()
  const updateLink = useUpdateSocialLink()
  const deleteLink = useDeleteSocialLink()
  const reorder = useReorderSocialLinks()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { platform: 'linkedin', url: '' } })

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      await createLink.mutateAsync({
        platform: values.platform,
        url: values.url,
        is_active: true,
        sort_order: links.length,
      })
      reset({ platform: 'linkedin', url: '' })
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...links]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorder.mutate(next.map((l) => l.id))
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Social Links</h1>
        <p className="mt-1 text-sm text-navy-500">Connect your social profiles and reorder how they appear.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <Select label="Platform" className="sm:w-48" {...register('platform')}>
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </Select>
          <Input
            label="Profile URL"
            placeholder="https://"
            className="flex-1"
            error={errors.url?.message}
            {...register('url', { required: 'A URL is required' })}
          />
          <Button type="submit" loading={isSubmitting}>
            Add
          </Button>
        </form>
      </Card>

      {!isLoading && links.length === 0 && <EmptyState title="No social links yet" description="Add your first one above." />}

      <div className="flex flex-col gap-3">
        {links.map((link, index) => (
          <Card key={link.id} interactive className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-navy-800">{PLATFORM_LABELS[link.platform]}</p>
              <p className="truncate text-sm text-navy-400">{link.url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded-lg border border-navy-200 p-1.5 text-navy-500 hover:bg-navy-50 disabled:opacity-30">
                ↑
              </button>
              <button onClick={() => move(index, 1)} disabled={index === links.length - 1} aria-label="Move down" className="rounded-lg border border-navy-200 p-1.5 text-navy-500 hover:bg-navy-50 disabled:opacity-30">
                ↓
              </button>
              <Toggle checked={link.is_active} onChange={(v) => updateLink.mutate({ id: link.id, input: { is_active: v } })} />
              <Button size="sm" variant="danger" onClick={() => deleteLink.mutate(link.id)}>
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
