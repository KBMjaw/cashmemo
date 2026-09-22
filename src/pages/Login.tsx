import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { loginSchema, type LoginFormValues } from '@/utils/validation'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
    if (error) {
      setSubmitError(friendlyError(error, 'Could not sign you in. Please try again.'))
      return
    }
    navigate(location.state?.from ?? '/dashboard', { replace: true })
  }

  async function onGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          New to One-Tap?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {submitError && <Alert tone="error">{submitError}</Alert>}

        <Input label="Email" type="email" required placeholder="you@example.com" error={errors.email?.message} {...register('email')} />

        <div>
          <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          Login
        </Button>

        <div className="relative my-1 flex items-center">
          <div className="h-px flex-1 bg-navy-100" />
          <span className="px-3 text-xs font-medium uppercase text-navy-300">or</span>
          <div className="h-px flex-1 bg-navy-100" />
        </div>

        <Button type="button" variant="outline" fullWidth onClick={onGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.2h6.5c-.1.9-.6 2.4-1.9 3.4l3 2.3c1.8-1.6 2.9-4 2.9-7.7z" />
            <path fill="#34A853" d="M12 24c2.6 0 4.8-.9 6.4-2.3l-3-2.3c-.8.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1l-3.1 2.4C4.1 21.6 7.7 24 12 24z" />
            <path fill="#FBBC05" d="M6.4 14.3c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2l-3.1-2.4C2.5 9.4 2 10.9 2 12.5s.5 3.1 1.3 4.6z" />
            <path fill="#EA4335" d="M12 6.9c1.5 0 2.8.5 3.8 1.5l2.7-2.7C16.8 4 14.6 3 12 3 7.7 3 4.1 5.4 2.9 8.9l3.1 2.4C6.8 8.9 9.1 6.9 12 6.9z" />
          </svg>
          Continue with Google
        </Button>
      </form>
    </AuthLayout>
  )
}
