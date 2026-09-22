import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { FileUploader } from '@/components/ui/FileUploader'
import { signUpSchema, type SignUpFormValues } from '@/utils/validation'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { useCheckUsernameAvailable } from '@/hooks/useProfile'

export default function SignUp() {
  const navigate = useNavigate()
  const checkUsername = useCheckUsernameAvailable()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) })

  async function onSubmit(values: SignUpFormValues) {
    setSubmitError(null)
    const available = await checkUsername(values.username)
    if (!available) {
      setError('username', { message: 'That username is already taken' })
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: values.fullName,
          username: values.username,
          phone: values.mobile,
          date_of_birth: values.dateOfBirth,
        },
      },
    })

    if (error) {
      setSubmitError(friendlyError(error, 'Could not create your account. Please try again.'))
      return
    }

    if (photoFile && data.user) {
      try {
        const ext = photoFile.name.split('.').pop() || 'jpg'
        const path = `${data.user.id}/${crypto.randomUUID()}.${ext}`
        await supabase.storage.from('profile-images').upload(path, photoFile)
        const { data: pub } = supabase.storage.from('profile-images').getPublicUrl(path)
        await supabase.from('profiles').update({ profile_photo_url: pub.publicUrl }).eq('id', data.user.id)
      } catch {
        // Non-fatal: user can add a photo later from the dashboard.
      }
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthLayout title="Check your inbox" subtitle="Verify your email to activate your One-Tap account.">
        <Alert tone="success">
          We&apos;ve sent a verification link to your email address. Click it to activate your account, then sign
          in to continue.
        </Alert>
        <Button className="mt-6" fullWidth onClick={() => navigate('/login')}>
          Go to login
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your One-Tap"
      subtitle={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {submitError && <Alert tone="error">{submitError}</Alert>}

        <FileUploader
          shape="circle"
          previewUrl={photoPreview}
          hint="Profile photo (optional)"
          onFileSelected={(file) => {
            setPhotoFile(file)
            setPhotoPreview(URL.createObjectURL(file))
          }}
        />

        <Input label="Full Name" required placeholder="Navaneethan Gunasekaran" error={errors.fullName?.message} {...register('fullName')} />

        <Input
          label="Date of Birth"
          type="date"
          required
          max={new Date().toISOString().split('T')[0]}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />

        <Input label="Email" type="email" required placeholder="you@example.com" error={errors.email?.message} {...register('email')} />

        <Input label="Mobile Number" type="tel" required placeholder="+91 98765 43210" error={errors.mobile?.message} {...register('mobile')} />

        <Input
          label="Username"
          required
          placeholder="naveen"
          hint="onetap.com/u/username — lowercase letters, numbers and underscore only"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} />
        <Input
          label="Confirm Password"
          type="password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Checkbox
          label={
            <>
              I agree to the{' '}
              <Link to="/terms" className="text-brand-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-brand-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </>
          }
          error={errors.agreeToTerms?.message}
          {...register('agreeToTerms')}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Create Your One-Tap
        </Button>
      </form>
    </AuthLayout>
  )
}
