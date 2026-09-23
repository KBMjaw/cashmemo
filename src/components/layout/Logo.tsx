import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <img src="/logo-icon.png" alt="One-Tap" className="h-8 w-8 shrink-0 object-contain" />
      <span className={cn('text-lg', dark ? 'text-white' : 'text-navy-900')}>One-Tap</span>
    </Link>
  )
}
