import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { ExperienceForm } from '@/components/dashboard/ExperienceForm'
import { useExperience, useCreateExperience, useUpdateExperience, useDeleteExperience } from '@/hooks/useExperience'
import { friendlyError } from '@/lib/errors'
import type { Experience } from '@/types/database'

export default function ExperiencePage() {
  const { data: items = [], isLoading } = useExperience()
  const create = useCreateExperience()
  const update = useUpdateExperience()
  const del = useDeleteExperience()
  const [editing, setEditing] = useState<Experience | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Experience</h1>
          <p className="mt-1 text-sm text-navy-500">Share your professional journey.</p>
        </div>
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
          <Card key={item.id} interactive className="flex items-start justify-between gap-4">
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
