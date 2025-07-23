'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase-client'
import { ToastContainer, useToast } from '../../../components/toast'
import { DriftTable } from '../../../components/drift-table'
import {
  useDrifts,
  useAddDriftToCache,
  useUpdateDriftInCache,
  type DriftEvent,
} from '../../../hooks/useDrifts'

export default function S3DriftsPage() {
  const [filters, setFilters] = useState({
    severity: 'all',
    acknowledged: 'all',
  })
  const { toasts, addToast, dismissToast } = useToast()

  // Filter for S3 resource type only
  const s3Filters = useMemo(() => ({
    ...filters,
    type: 'S3',
  }), [filters])

  const {
    data: drifts = [],
    isLoading,
  } = useDrifts(s3Filters)

  const addDriftToCache = useAddDriftToCache()
  const updateDriftInCache = useUpdateDriftInCache()

  // WebSocket subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('drift_events_changes_s3_page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drift_events',
          filter: `resource_type=eq.S3`,
        },
        (payload) => {
          const newDrift = payload.new as DriftEvent

          if (newDrift.severity === 'HIGH' || newDrift.severity === 'CRITICAL') {
            addToast({
              title: `${newDrift.severity} S3 Drift Detected!`,
              message: `${newDrift.resource_id} (${newDrift.change_type})`,
              type: newDrift.severity === 'CRITICAL' ? 'error' : 'warning',
              duration: 10000,
            })
          }

          addDriftToCache(newDrift)
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
          <h2 className="text-2xl font-bold text-text-primary">S3 Drift Events</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Configuration drift for S3 storage buckets
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-4 py-2 rounded-md border border-border bg-surface text-text-primary focus:ring-2 focus:ring-aws-orange focus:border-aws-orange"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status
            </label>
            <select
              value={filters.acknowledged}
              onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value })}
              className="px-4 py-2 rounded-md border border-border bg-surface text-text-primary focus:ring-2 focus:ring-aws-orange focus:border-aws-orange"
            >
              <option value="all">All</option>
              <option value="false">Unacknowledged</option>
              <option value="true">Acknowledged</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="text-sm text-text-secondary">Total S3 Drifts</div>
            <div className="text-2xl font-bold text-text-primary mt-1">
              {drifts.length}
            </div>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="text-sm text-text-secondary">Critical + High</div>
            <div className="text-2xl font-bold text-red-500 mt-1">
              {drifts.filter(d => d.severity === 'CRITICAL' || d.severity === 'HIGH').length}
            </div>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="text-sm text-text-secondary">Unacknowledged</div>
            <div className="text-2xl font-bold text-aws-orange mt-1">
              {drifts.filter(d => !d.acknowledged).length}
            </div>
          </div>
        </div>

        {/* Drift Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
            <p className="mt-2 text-sm text-text-secondary">Loading S3 drifts...</p>
          </div>
        ) : (
          <DriftTable drifts={drifts} />
        )}
      </div>
    </>
  )
}
