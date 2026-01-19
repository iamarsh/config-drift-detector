'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import { formatTimestamp } from '../../lib/utils'

interface Baseline {
  id: string
  account_id: string
  created_at: string
  snapshot: {
    accountId: string
    region: string
    timestamp: string
    resources: any[]
  }
}

export default function BaselinesPage() {
  const [baseline, setBaseline] = useState<Baseline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBaseline()
  }, [])

  async function fetchBaseline() {
    try {
      const { data, error } = await supabase
        .from('baselines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      setBaseline(data)
    } catch (error) {
      console.error('Error fetching baseline:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
          <p className="mt-2 text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!baseline) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Baseline Configuration</h2>
          <p className="mt-1 text-sm text-text-secondary">
            View the current baseline snapshot
          </p>
        </div>
        <div className="text-center py-12 bg-surface shadow rounded-lg border border-border">
          <p className="text-sm text-text-secondary">No baseline found</p>
        </div>
      </div>
    )
  }

  const resourceCounts = baseline.snapshot.resources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Baseline Configuration</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Current baseline snapshot used for drift detection
        </p>
      </div>

      <div className="bg-surface shadow overflow-hidden sm:rounded-lg mb-6 border border-border">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary">
            Baseline Information
          </h3>
        </div>
        <div className="border-t border-border">
          <dl>
            <div className="bg-surface-elevated px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-text-secondary">Account ID</dt>
              <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                {baseline.snapshot.accountId}
              </dd>
            </div>
            <div className="bg-surface px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-text-secondary">Region</dt>
              <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                {baseline.snapshot.region}
              </dd>
            </div>
            <div className="bg-surface-elevated px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-text-secondary">Created At</dt>
              <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                {formatTimestamp(baseline.created_at)}
              </dd>
            </div>
            <div className="bg-surface px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-text-secondary">Snapshot Timestamp</dt>
              <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                {formatTimestamp(baseline.snapshot.timestamp)}
              </dd>
            </div>
            <div className="bg-surface-elevated px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-text-secondary">Total Resources</dt>
              <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">
                {baseline.snapshot.resources.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-surface shadow overflow-hidden sm:rounded-lg border border-border">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary">
            Resource Breakdown
          </h3>
        </div>
        <div className="border-t border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Resource Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {Object.entries(resourceCounts).map(([type, count]) => (
                <tr key={type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {count as number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
