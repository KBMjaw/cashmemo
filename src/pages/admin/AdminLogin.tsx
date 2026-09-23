import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { adminLogAction } from '@/hooks/useAdmin'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
    if (error) {
      setSubmitError(friendlyError(error, 'Could not sign you in. Please try again.'))
      return
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')
    if (roleError || !isAdmin) {
      await supabase.auth.signOut()
      setSubmitError('This account does not have admin access.')
      return
    }

    adminLogAction('ADMIN_LOGIN')
    navigate(location.state?.from ?? '/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400">One-Tap</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">Admin Sign In</h1>
          <p className="mt-2 text-sm text-navy-300">Restricted to authorized administrators.</p>
        </div>

        <div className="rounded-xl2 bg-white p-6 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {submitError && <Alert tone="error">{submitError}</Alert>}
            <Input label="Email" type="email" required placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} />
            <Button type="submit" fullWidth loading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
