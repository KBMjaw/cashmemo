import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

const fieldClasses =
  'w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-navy-50 disabled:text-navy-400'

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-navy-800">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        id={fieldId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldClasses, error && 'border-red-400 focus:border-red-500 focus:ring-red-500', className)}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${fieldId}-hint`} className="text-sm text-navy-400">
          {hint}
        </p>
      )}
    </div>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-navy-800">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        ref={ref}
        aria-invalid={!!error}
        className={cn(fieldClasses, 'min-h-[100px] resize-y', error && 'border-red-400', className)}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && hint && <p className="text-sm text-navy-400">{hint}</p>}
    </div>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className, id, children, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-navy-800">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <select id={fieldId} ref={ref} className={cn(fieldClasses, 'bg-white', error && 'border-red-400', className)} {...props}>
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && hint && <p className="text-sm text-navy-400">{hint}</p>}
    </div>
  )
})
