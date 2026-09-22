import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Business, Experience, PortfolioItem, SocialLink } from '@/types/database'

export function usePublicBusinesses(userId?: string) {
  return useQuery({
    queryKey: ['public-businesses', userId],
    queryFn: async (): Promise<Business[]> => {
      if (!userId) return []
      const { data, error } = await supabase.from('businesses').select('*').eq('user_id', userId).order('sort_order')
      if (error) throw error
      return data as Business[]
    },
    enabled: !!userId,
  })
}

export function usePublicSocialLinks(userId?: string) {
  return useQuery({
    queryKey: ['public-social-links', userId],
    queryFn: async (): Promise<SocialLink[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data as SocialLink[]
    },
    enabled: !!userId,
  })
}

export function usePublicPortfolio(userId?: string) {
  return useQuery({
    queryKey: ['public-portfolio', userId],
    queryFn: async (): Promise<PortfolioItem[]> => {
      if (!userId) return []
      const { data, error } = await supabase.from('portfolio').select('*').eq('user_id', userId).order('sort_order')
      if (error) throw error
      return data as PortfolioItem[]
    },
    enabled: !!userId,
  })
}

export function usePublicExperience(userId?: string) {
  return useQuery({
    queryKey: ['public-experience', userId],
    queryFn: async (): Promise<Experience[]> => {
      if (!userId) return []
      const { data, error } = await supabase.from('experience').select('*').eq('user_id', userId).order('sort_order')
      if (error) throw error
      return data as Experience[]
    },
    enabled: !!userId,
  })
}
