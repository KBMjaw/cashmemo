import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  action?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-gray-800">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}
