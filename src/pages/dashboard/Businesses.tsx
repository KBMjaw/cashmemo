import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { BusinessForm } from '@/components/dashboard/BusinessForm'
import {
  useBusinesses,
  useUpdateBusiness,
  useDeleteBusiness,
  useSetPrimaryBusiness,
  useReorderBusinesses,
} from '@/hooks/useBusinesses'
import { friendlyError } from '@/lib/errors'
import type { Business } from '@/types/database'

export default function Businesses() {
  const { data: businesses = [], isLoading } = useBusinesses()
  const updateBusiness = useUpdateBusiness()
  const deleteBusiness = useDeleteBusiness()
  const setPrimary = useSetPrimaryBusiness()
  const reorder = useReorderBusinesses()

  const [editing, setEditing] = useState<Business | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Business | null>(null)
  const [error, setError] = useState<string | null>(null)

  function move(index: number, direction: -1 | 1) {
    const next = [...businesses]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorder.mutate(next.map((b) => b.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Businesses</h1>
          <p className="mt-1 text-sm text-navy-500">Add every business you run — visitors see them on your profile.</p>
        </div>
        <Link to="/dashboard/businesses/new">
          <Button>+ Add Business</Button>
        </Link>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {!isLoading && businesses.length === 0 && (
        <EmptyState
          title="You haven't added a business yet."
          description="Add your company details so visitors can reach you."
          action={
            <Link to="/dashboard/businesses/new">
              <Button>+ Add Business</Button>
            </Link>
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {businesses.map((business, index) => (
          <Card key={business.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar src={business.logo_url} name={business.name} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-navy-800">{business.name}</p>
                  {business.is_primary && <Badge tone="brand">Primary</Badge>}
                </div>
                <p className="truncate text-sm text-navy-400">{business.designation || business.industry || '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="rounded-lg border border-navy-200 p-1.5 text-navy-500 hover:bg-navy-50 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === businesses.length - 1}
                aria-label="Move down"
                className="rounded-lg border border-navy-200 p-1.5 text-navy-500 hover:bg-navy-50 disabled:opacity-30"
              >
                ↓
              </button>
              {!business.is_primary && (
                <Button size="sm" variant="outline" onClick={() => setPrimary.mutate(business.id)}>
                  Set primary
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditing(business)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(business)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? ''}`} size="lg">
        {editing && (
          <BusinessForm
            initial={editing}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              try {
                await updateBusiness.mutateAsync({ id: editing.id, input: values })
                setEditing(null)
              } catch (err) {
                setError(friendlyError(err))
              }
            }}
          />
        )}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete business?">
        <p className="text-sm text-navy-500">
          This will remove <span className="font-medium text-navy-800">{confirmDelete?.name}</span> from your public
          profile. This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteBusiness.isPending}
            onClick={async () => {
              if (!confirmDelete) return
              try {
                await deleteBusiness.mutateAsync(confirmDelete.id)
                setConfirmDelete(null)
              } catch (err) {
                setError(friendlyError(err))
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
