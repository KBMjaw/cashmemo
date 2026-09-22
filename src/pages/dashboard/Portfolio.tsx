import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/utils/cn'
import { PortfolioForm } from '@/components/dashboard/PortfolioForm'
import { ExperienceForm } from '@/components/dashboard/ExperienceForm'
import {
  usePortfolio,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
} from '@/hooks/usePortfolio'
import {
  useExperience,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '@/hooks/useExperience'
import { friendlyError } from '@/lib/errors'
import type { PortfolioItem, Experience } from '@/types/database'

export default function Portfolio() {
  const [tab, setTab] = useState<'portfolio' | 'experience'>('portfolio')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Portfolio</h1>
        <p className="mt-1 text-sm text-navy-500">Showcase your work, projects and professional experience.</p>
      </div>

      <div className="inline-flex w-fit rounded-lg border border-navy-100 bg-navy-50 p-1">
        {(['portfolio', 'experience'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              tab === t ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'portfolio' ? <PortfolioTab /> : <ExperienceTab />}
    </div>
  )
}

function PortfolioTab() {
  const { data: items = [], isLoading } = usePortfolio()
  const create = useCreatePortfolioItem()
  const update = useUpdatePortfolioItem()
  const del = useDeletePortfolioItem()
  const [editing, setEditing] = useState<PortfolioItem | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>+ Add Project</Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {!isLoading && items.length === 0 && (
        <EmptyState
          title="Showcase your work and projects."
          description="Add a project to display it on your profile."
          action={<Button onClick={() => setEditing('new')}>+ Add Project</Button>}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3">
            {item.cover_image_url && (
              <img src={item.cover_image_url} alt="" className="h-32 w-full rounded-lg object-cover" />
            )}
            <div>
              <p className="font-semibold text-navy-800">{item.title}</p>
              {item.category && <p className="text-xs font-medium uppercase text-brand-500">{item.category}</p>}
              {item.description && <p className="mt-1 line-clamp-2 text-sm text-navy-500">{item.description}</p>}
            </div>
            <div className="mt-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => del.mutate(item.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add project' : 'Edit project'} size="lg">
        {editing && (
          <PortfolioForm
            initial={editing === 'new' ? undefined : editing}
            submitLabel={editing === 'new' ? 'Add project' : 'Save changes'}
            onSubmit={async (values) => {
              try {
                if (editing === 'new') await create.mutateAsync(values)
                else await update.mutateAsync({ id: editing.id, input: values })
                setEditing(null)
              } catch (err) {
                setError(friendlyError(err))
              }
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function ExperienceTab() {
  const { data: items = [], isLoading } = useExperience()
  const create = useCreateExperience()
  const update = useUpdateExperience()
  const del = useDeleteExperience()
  const [editing, setEditing] = useState<Experience | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>+ Add Experience</Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {!isLoading && items.length === 0 && (
        <EmptyState
          title="No experience added yet"
          description="Share your professional journey."
          action={<Button onClick={() => setEditing('new')}>+ Add Experience</Button>}
        />
      )}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-navy-800">{item.position}</p>
              <p className="text-sm text-navy-500">{item.company}</p>
              <p className="text-xs text-navy-400">
                {item.start_date ?? '—'} – {item.is_current ? 'Present' : item.end_date ?? '—'}
              </p>
              {item.description && <p className="mt-2 text-sm text-navy-500">{item.description}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => del.mutate(item.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add experience' : 'Edit experience'}>
        {editing && (
          <ExperienceForm
            initial={editing === 'new' ? undefined : editing}
            submitLabel={editing === 'new' ? 'Add experience' : 'Save changes'}
            onSubmit={async (values) => {
              try {
                if (editing === 'new') await create.mutateAsync(values)
                else await update.mutateAsync({ id: editing.id, input: values })
                setEditing(null)
              } catch (err) {
                setError(friendlyError(err))
              }
            }}
          />
        )}
      </Modal>
    </div>
  )
}
