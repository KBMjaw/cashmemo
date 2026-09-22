import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
        <span className="h-3 w-3 rounded-full bg-brand-500" />
      </span>
      <span className={cn('text-lg', dark ? 'text-white' : 'text-navy-900')}>One-Tap</span>
    </Link>
  )
}
