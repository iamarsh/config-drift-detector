import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase-client'

export interface Baseline {
  id: string
  snapshot: any
  created_at: string
  created_by?: string
  is_current?: boolean
}

/**
 * Hook for fetching the current baseline
 *
 * @returns Query result with current baseline
 */
export function useCurrentBaseline() {
  return useQuery({
    queryKey: ['baseline', 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baselines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      return data?.[0] as Baseline | undefined
    },
    staleTime: 60000, // Consider fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for fetching all baselines (for history view)
 *
 * @returns Query result with all baselines
 */
export function useBaselines() {
  return useQuery({
    queryKey: ['baselines', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baselines')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as Baseline[]
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
  })
}
