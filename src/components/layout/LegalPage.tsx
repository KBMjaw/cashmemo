interface LegalPageProps {
  title: string
  updated?: string
  children: React.ReactNode
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="container-app max-w-2xl py-20">
      <h1 className="text-4xl font-bold text-navy-900">{title}</h1>
      {updated && <p className="mt-2 text-sm text-navy-400">Last updated: {updated}</p>}
      <div className="prose prose-navy mt-8 flex flex-col gap-4 text-navy-600 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-navy-800">
        {children}
      </div>
    </div>
  )
}
