'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase-client'
import { SummaryCards } from '../components/summary-cards'
import { DriftTable } from '../components/drift-table'
import { ToastContainer, useToast } from '../components/toast'
import {
  useDrifts,
  useAddDriftToCache,
  useUpdateDriftInCache,
  type DriftEvent,
} from '../hooks/useDrifts'

export type { DriftEvent }

export default function Home() {
  const { toasts, addToast, dismissToast } = useToast()

  // Use React Query for data fetching - automatic caching and deduplication
  const {
    data: drifts = [],
    isLoading,
    refetch,
  } = useDrifts({ limit: 20 })

  // Optimistic cache update hooks for WebSocket events
  const addDriftToCache = useAddDriftToCache()
  const updateDriftInCache = useUpdateDriftInCache()

  // WebSocket subscriptions (runs once on mount)
  useEffect(() => {
    const channel = supabase
      .channel('drift_events_changes_dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drift_events',
        },
        (payload) => {
          const newDrift = payload.new as DriftEvent

          // Add to cache optimistically
          addDriftToCache(newDrift)

          // Show toast notification for HIGH/CRITICAL drifts
          if (newDrift.severity === 'HIGH' || newDrift.severity === 'CRITICAL') {
            addToast({
              title: `${newDrift.severity} Drift Detected!`,
              message: `${newDrift.resource_type}: ${newDrift.resource_id} (${newDrift.change_type})`,
              type: newDrift.severity === 'CRITICAL' ? 'error' : 'warning',
              duration: 10000,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drift_events',
        },
        (payload) => {
          const updatedDrift = payload.new as DriftEvent
          // Update in cache optimistically
          updateDriftInCache(updatedDrift)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor AWS configuration drift in real-time
          </p>
        </div>

        <SummaryCards drifts={drifts} />

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Recent Drift Events
          </h3>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
              <p className="mt-2 text-sm text-text-secondary">Loading...</p>
            </div>
          ) : (
            <DriftTable drifts={drifts} onDriftAcknowledged={() => refetch()} />
          )}
        </div>
      </div>
    </>
  )
}
