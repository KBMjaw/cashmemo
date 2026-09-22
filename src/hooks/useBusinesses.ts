import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { createOwnedCollectionHooks } from '@/hooks/useOwnedCollection'
import type { Business, BusinessInput } from '@/types/database'

const hooks = createOwnedCollectionHooks<Business, BusinessInput>('businesses', 'businesses')

export const useBusinesses = hooks.useList
export const useCreateBusiness = hooks.useCreate
export const useUpdateBusiness = hooks.useUpdate
export const useDeleteBusiness = hooks.useDelete
export const useReorderBusinesses = hooks.useReorder

export function useSetPrimaryBusiness() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (businessId: string) => {
      if (!user) throw new Error('Not authenticated')
      // Clear existing primary first to satisfy the partial-unique-index constraint.
      await supabase.from('businesses').update({ is_primary: false }).eq('user_id', user.id).eq('is_primary', true)
      const { error } = await supabase.from('businesses').update({ is_primary: true }).eq('id', businessId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses', user?.id] }),
  })
}
