import { z } from 'zod'

const RESERVED_USERNAMES = new Set([
  'admin', 'login', 'signup', 'dashboard', 'settings', 'api', 'support',
  'about', 'contact', 'pricing', 'terms', 'privacy', 'features', 'templates',
  'u', 'www', 'root', 'onetap', 'one-tap', 'help', 'billing', 'legal', 'cookies',
  'quick-qr', 'forgot-password', 'reset-password', 'x',
])

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscore are allowed')
  .refine((v) => !RESERVED_USERNAMES.has(v), { message: 'This username is reserved' })

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number')

export const emailSchema = z.string().email('Enter a valid email address')

const mobileRegex = /^(\+?\d{1,3}[\s-]?)?\d{10}$/

export const mobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .refine((v) => mobileRegex.test(v.replace(/\s/g, '')), {
    message: 'Enter a valid mobile number',
  })

export const dobSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .refine((v) => {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return false
    return d.getTime() < Date.now()
  }, { message: 'Date of birth cannot be in the future' })

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    dateOfBirth: dobSchema,
    email: emailSchema,
    mobile: mobileSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms of Service and Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
