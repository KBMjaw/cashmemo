import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { BusinessCard } from '@/types/database'

export default function Cards() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['business-cards', user?.id],
    queryFn: async (): Promise<BusinessCard[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as BusinessCard[]
    },
    enabled: !!user,
  })

  async function handleDelete(id: string) {
    await supabase.from('business_cards').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['business-cards', user?.id] })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Business Cards</h1>
          <p className="mt-1 text-sm text-navy-500">Design print-ready cards linked to your One-Tap profile.</p>
        </div>
        <Link to="/dashboard/cards/new">
          <Button>Create Card</Button>
        </Link>
      </div>

      {!isLoading && cards.length === 0 && (
        <EmptyState
          title="Create your first digital business card."
          description="Pick a template and we'll fill it in from your profile."
          action={
            <Link to="/dashboard/cards/new">
              <Button>Create Card</Button>
            </Link>
          }
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.id} interactive className="flex flex-col gap-3">
            {c.preview_url ? (
              <img src={c.preview_url} alt={c.name} className="aspect-[7/4] w-full rounded-lg object-cover" />
            ) : (
              <div className="flex aspect-[7/4] w-full items-center justify-center rounded-lg bg-navy-50 text-sm text-navy-400">
                No preview yet
              </div>
            )}
            <p className="font-semibold text-navy-800">{c.name}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/cards/new?id=${c.id}`)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
