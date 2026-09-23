import { cn } from '@/utils/cn'

export function Card({
  className,
  children,
  interactive,
}: {
  className?: string
  children: React.ReactNode
  /** Adds hover elevation/border feedback for cards that act as clickable surfaces. */
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-navy-100 bg-white p-5 shadow-card transition-all duration-200 ease-out',
        interactive && 'hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-cardHover',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'brand'
}) {
  const tones = {
    neutral: 'bg-navy-100 text-navy-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    brand: 'bg-brand-100 text-brand-700',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}
