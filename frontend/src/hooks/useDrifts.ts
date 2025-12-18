import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase-client'

export interface DriftEvent {
  id: string
  account_id: string
  resource_id: string
  resource_type: string
  change_type: string
  severity: string
  detected_at: string
  acknowledged: boolean
  changes?: any
  snapshot?: string
  region?: string
  acknowledged_at?: string
  // Audit trail metadata
  detected_by?: string
  detection_run_id?: string
  snapshot_key?: string
}

export interface DriftFilters {
  severity?: string
  type?: string
  acknowledged?: string
  limit?: number
}

/**
 * Centralized hook for fetching drift events
 *
 * Features:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Error handling
 * - Loading states
 *
 * @param filters - Optional filters for drift events
 * @returns Query result with drifts data and metadata
 */
export function useDrifts(filters: DriftFilters = {}) {
  return useQuery({
    queryKey: ['drifts', filters],
    queryFn: async () => {
      let query = supabase
        .from('drift_events')
        .select('*')
        .order('detected_at', { ascending: false })

      if (filters.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity)
      }

      if (filters.type && filters.type !== 'all') {
        query = query.eq('resource_type', filters.type)
      }

      if (filters.acknowledged && filters.acknowledged !== 'all') {
        query = query.eq('acknowledged', filters.acknowledged === 'true')
      }

      // Apply default pagination limit to prevent excessive memory usage
      const limit = filters.limit || 500
      query = query.limit(limit)

      const { data, error } = await query

      if (error) throw error

      return data as DriftEvent[]
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep unused data in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: false, // Disable polling - use WebSocket instead
  })
}

/**
 * Hook for fetching drifts within a time range (for trends)
 *
 * @param daysAgo - Number of days to look back
 * @returns Query result with filtered drifts
 */
export function useDriftTrends(daysAgo: number = 30) {
  return useQuery({
    queryKey: ['drift-trends', daysAgo],
    queryFn: async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      const { data, error } = await supabase
        .from('drift_events')
        .select('*')
        .gte('detected_at', startDate.toISOString())
        .order('detected_at', { ascending: true })
        .limit(5000) // Limit to prevent excessive memory usage

      if (error) throw error

      return data as DriftEvent[]
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 600000, // Keep in cache for 10 minutes
  })
}

/**
 * Mutation hook for acknowledging a drift event
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Error rollback
 *
 * @returns Mutation function and state
 */
export function useAcknowledgeDrift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (driftId: string) => {
      const { data, error } = await supabase
        .from('drift_events')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', driftId)
        .select()
        .single()

      if (error) throw error

      return data as DriftEvent
    },
    // Optimistic update: update UI immediately before API call completes
    onMutate: async (driftId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['drifts'] })

      // Snapshot previous value
      const previousDrifts = queryClient.getQueriesData({ queryKey: ['drifts'] })

      // Optimistically update all drift queries
      queryClient.setQueriesData<DriftEvent[]>(
        { queryKey: ['drifts'] },
        (old) => {
          if (!old) return old
          return old.map((drift) =>
            drift.id === driftId
              ? { ...drift, acknowledged: true, acknowledged_at: new Date().toISOString() }
              : drift
          )
        }
      )

      return { previousDrifts }
    },
    // On error, rollback to previous state
    onError: (_err, _driftId, context) => {
      if (context?.previousDrifts) {
        context.previousDrifts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    // Always refetch after mutation (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] })
    },
  })
}

/**
 * Hook for invalidating drift queries
 * Useful when receiving real-time updates via WebSocket
 *
 * @returns Function to invalidate drift cache
 */
export function useInvalidateDrifts() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['drifts'] })
    queryClient.invalidateQueries({ queryKey: ['drift-trends'] })
  }
}

/**
 * Hook for adding a new drift to the cache optimistically
 * Useful when receiving INSERT events via WebSocket
 *
 * @returns Function to add drift to cache
 */
export function useAddDriftToCache() {
  const queryClient = useQueryClient()

  return (newDrift: DriftEvent) => {
    queryClient.setQueriesData<DriftEvent[]>(
      { queryKey: ['drifts'] },
      (old) => {
        if (!old) return [newDrift]
        // Add to beginning, remove duplicates, limit to reasonable size
        const filtered = old.filter(d => d.id !== newDrift.id)
        return [newDrift, ...filtered].slice(0, 100)
      }
    )
  }
}

/**
 * Hook for updating a drift in the cache
 * Useful when receiving UPDATE events via WebSocket
 *
 * @returns Function to update drift in cache
 */
export function useUpdateDriftInCache() {
  const queryClient = useQueryClient()

  return (updatedDrift: DriftEvent) => {
    queryClient.setQueriesData<DriftEvent[]>(
      { queryKey: ['drifts'] },
      (old) => {
        if (!old) return old
        return old.map((drift) =>
          drift.id === updatedDrift.id ? updatedDrift : drift
        )
      }
    )
  }
}
