import { useForm } from 'react-hook-form'
import { Input, Textarea } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import type { Experience, ExperienceInput } from '@/types/database'

interface ExperienceFormProps {
  initial?: Experience
  onSubmit: (values: ExperienceInput) => Promise<void>
  submitLabel?: string
}

type FormValues = {
  company: string
  position: string
  start_date: string
  end_date: string
  is_current: boolean
  description: string
}

export function ExperienceForm({ initial, onSubmit, submitLabel = 'Save experience' }: ExperienceFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      company: initial?.company ?? '',
      position: initial?.position ?? '',
      start_date: initial?.start_date ?? '',
      end_date: initial?.end_date ?? '',
      is_current: initial?.is_current ?? false,
      description: initial?.description ?? '',
    },
  })

  const isCurrent = watch('is_current')

  async function submit(values: FormValues) {
    await onSubmit({
      company: values.company,
      position: values.position,
      start_date: values.start_date || null,
      end_date: values.is_current ? null : values.end_date || null,
      is_current: values.is_current,
      description: values.description || null,
      sort_order: initial?.sort_order ?? 0,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <Input label="Company" required error={errors.company?.message} {...register('company', { required: 'Company is required' })} />
      <Input label="Position" required error={errors.position?.message} {...register('position', { required: 'Position is required' })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start Date" type="date" {...register('start_date')} />
        <Input label="End Date" type="date" disabled={isCurrent} {...register('end_date')} />
      </div>
      <Checkbox label="Currently working here" {...register('is_current')} />
      <Textarea label="Description" {...register('description')} />
      <Button type="submit" loading={isSubmitting} className="self-start">
        {submitLabel}
      </Button>
    </form>
  )
}
