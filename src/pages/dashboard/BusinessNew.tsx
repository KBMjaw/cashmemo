import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { BusinessForm } from '@/components/dashboard/BusinessForm'
import { useCreateBusiness } from '@/hooks/useBusinesses'
import { friendlyError } from '@/lib/errors'
import { useState } from 'react'

export default function BusinessNew() {
  const navigate = useNavigate()
  const createBusiness = useCreateBusiness()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Add a business</h1>
        <p className="mt-1 text-sm text-navy-500">Tell visitors about the company you run.</p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <Card>
        <BusinessForm
          submitLabel="Add business"
          onSubmit={async (values) => {
            try {
              await createBusiness.mutateAsync(values)
              navigate('/dashboard/businesses')
            } catch (err) {
              setError(friendlyError(err))
            }
          }}
        />
      </Card>
    </div>
  )
}
