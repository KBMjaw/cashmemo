import type { SocialPlatform } from '@/types/database'

const LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
  github: 'GitHub',
  threads: 'Threads',
  telegram: 'Telegram',
  pinterest: 'Pinterest',
}

const INITIALS: Record<SocialPlatform, string> = {
  linkedin: 'in',
  instagram: 'IG',
  facebook: 'f',
  x: 'X',
  youtube: '▶',
  github: 'GH',
  threads: '@',
  telegram: 'TG',
  pinterest: 'P',
}

export function socialLabel(platform: SocialPlatform) {
  return LABELS[platform]
}

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  return (
    <span
      className={
        className ??
        'flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-600 transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-100 hover:text-brand-700 hover:shadow-sm'
      }
      aria-hidden="true"
    >
      {INITIALS[platform]}
    </span>
  )
}
