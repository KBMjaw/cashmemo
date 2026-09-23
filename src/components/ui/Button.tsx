import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/ui/Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:bg-brand-300 disabled:shadow-none disabled:active:scale-100',
  secondary: 'bg-navy-900 text-white shadow-sm hover:bg-navy-800 hover:shadow-md active:scale-[0.98] disabled:bg-navy-400 disabled:shadow-none disabled:active:scale-100',
  outline: 'border border-navy-200 text-navy-900 hover:border-navy-300 hover:bg-navy-50 active:scale-[0.98] disabled:text-navy-300 disabled:active:scale-100',
  ghost: 'text-navy-700 hover:bg-navy-50 active:scale-[0.98] disabled:text-navy-300 disabled:active:scale-100',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:bg-red-300 disabled:shadow-none disabled:active:scale-100',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, fullWidth, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 ease-out disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
})
