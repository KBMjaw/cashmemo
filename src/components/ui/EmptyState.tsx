interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 border border-dashed border-navy-200 bg-navy-50/50 px-6 py-14 text-center">
      {icon && <div className="text-navy-300">{icon}</div>}
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-navy-800">{title}</h3>
        {description && <p className="text-sm text-navy-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
