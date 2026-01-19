'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'
import { SummaryCards } from '../components/summary-cards'
import { DriftTable } from '../components/drift-table'

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

  useEffect(() => {
    fetchDrifts()

    // Poll every 5 seconds
    const interval = setInterval(fetchDrifts, 5000)

    return () => clearInterval(interval)
  }, [])

  async function fetchDrifts() {
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
  }

  return (
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
  )
}
