import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, ProfileUpdate } from '@/types/database'

export function useMyProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) throw error
      return data as Profile
    },
    enabled: !!user,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => {
      qc.setQueryData(['profile', data.id], data)
    },
  })
}

export function usePublicProfile(username: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!username,
    retry: false,
  })
}

export function useCheckUsernameAvailable() {
  return async (username: string, excludeUserId?: string) => {
    let query = supabase.from('profiles').select('id').eq('username', username.toLowerCase())
    if (excludeUserId) query = query.neq('id', excludeUserId)
    const { data, error } = await query.maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    return !data
  }
}
