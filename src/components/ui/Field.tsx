import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, error, required, children, className }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400'

export const selectClass = inputClass + ' pr-8'
