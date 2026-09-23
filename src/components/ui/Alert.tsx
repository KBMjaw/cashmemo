import { cn } from '@/utils/cn'

interface AlertProps {
  tone?: 'error' | 'success' | 'info'
  children: React.ReactNode
  className?: string
}

const tones = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-brand-50 text-brand-700 border-brand-200',
}

export function Alert({ tone = 'info', children, className }: AlertProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border px-4 py-3 text-sm', tones[tone], className)}>
      {children}
    </div>
  )
}
