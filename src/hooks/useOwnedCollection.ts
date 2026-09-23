import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/**
 * Factory for the common "list rows owned by the current user, ordered by
 * sort_order, with insert/update/delete/reorder" pattern shared by
 * businesses, social_links, portfolio and experience.
 */
export function createOwnedCollectionHooks<Row extends { id: string; sort_order: number }, Input>(
  table: string,
  queryKey: string,
) {
  function useList(userId?: string) {
    const { user } = useAuth()
    const effectiveId = userId ?? user?.id
    return useQuery({
      queryKey: [queryKey, effectiveId],
      queryFn: async (): Promise<Row[]> => {
        if (!effectiveId) return []
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', effectiveId)
          .order('sort_order', { ascending: true })
        if (error) throw error
        return data as Row[]
      },
      enabled: !!effectiveId,
    })
  }

  function useCreate() {
    const { user } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (input: Partial<Input>) => {
        if (!user) throw new Error('Not authenticated')
        const { data, error } = await supabase
          .from(table)
          .insert({ ...input, user_id: user.id })
          .select()
          .single()
        if (error) throw error
        return data as Row
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, user?.id] }),
    })
  }

  function useUpdate() {
    const { user } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, input }: { id: string; input: Partial<Input> }) => {
        const { data, error } = await supabase.from(table).update(input as never).eq('id', id).select().single()
        if (error) throw error
        return data as Row
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, user?.id] }),
    })
  }

  function useDelete() {
    const { user } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) throw error
        return id
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, user?.id] }),
    })
  }

  function useReorder() {
    const { user } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (orderedIds: string[]) => {
        await Promise.all(
          orderedIds.map((id, index) =>
            supabase.from(table).update({ sort_order: index }).eq('id', id),
          ),
        )
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, user?.id] }),
    })
  }

  return { useList, useCreate, useUpdate, useDelete, useReorder }
}
