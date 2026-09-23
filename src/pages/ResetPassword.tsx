import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { resetPasswordSchema } from '@/utils/validation'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'

type FormValues = { password: string; confirmPassword: string }

export default function ResetPassword() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setSubmitError(friendlyError(error))
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {submitError && <Alert tone="error">{submitError}</Alert>}
        <Input label="New Password" type="password" required error={errors.password?.message} {...register('password')} />
        <Input
          label="Confirm New Password"
          type="password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
