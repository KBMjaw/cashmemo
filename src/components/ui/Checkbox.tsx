import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-700">
        <input
          id={fieldId}
          ref={ref}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy-300 text-brand-600 focus:ring-brand-500"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
})
