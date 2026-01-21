'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase-client'
import { SummaryCards } from '../components/summary-cards'
import { DriftTable } from '../components/drift-table'
import { ToastContainer, useToast } from '../components/toast'

export interface DriftEvent {
  id: string
  account_id: string
  resource_id: string
  resource_type: string
  change_type: string
  severity: string
  detected_at: string
  acknowledged: boolean
}

export default function Home() {
  const [drifts, setDrifts] = useState<DriftEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, addToast, dismissToast } = useToast()

  const fetchDrifts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('drift_events')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setDrifts(data || [])
    } catch (error) {
      console.error('Error fetching drifts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchDrifts()

    // Set up Realtime subscription
    const channel = supabase
      .channel('drift_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drift_events'
        },
        (payload) => {
          const newDrift = payload.new as DriftEvent

          // Add to drifts list
          setDrifts((prevDrifts) => [newDrift, ...prevDrifts.slice(0, 19)])

          // Show toast notification for HIGH/CRITICAL drifts
          if (newDrift.severity === 'HIGH' || newDrift.severity === 'CRITICAL') {
            addToast({
              title: `${newDrift.severity} Drift Detected!`,
              message: `${newDrift.resource_type}: ${newDrift.resource_id} (${newDrift.change_type})`,
              type: newDrift.severity === 'CRITICAL' ? 'error' : 'warning',
              duration: 10000
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drift_events'
        },
        (payload) => {
          const updatedDrift = payload.new as DriftEvent
          setDrifts((prevDrifts) =>
            prevDrifts.map((drift) => (drift.id === updatedDrift.id ? updatedDrift : drift))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDrifts, addToast])

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
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
              <p className="mt-2 text-sm text-text-secondary">Loading...</p>
            </div>
          ) : (
            <DriftTable drifts={drifts} onDriftAcknowledged={() => fetchDrifts()} />
          )}
        </div>
      </div>
    </>
  )
}
