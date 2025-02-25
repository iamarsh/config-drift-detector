'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import { DriftTable } from '../../components/drift-table'
import { ToastContainer, useToast } from '../../components/toast'
import {
  useDrifts,
  useAddDriftToCache,
  useUpdateDriftInCache,
  type DriftEvent,
} from '../../hooks/useDrifts'

export default function DriftsPage() {
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    acknowledged: 'all',
  })
  const { toasts, addToast, dismissToast } = useToast()

  // Use React Query for data fetching - automatic caching based on filters
  const {
    data: drifts = [],
    isLoading,
    refetch,
  } = useDrifts(filters)

  // Optimistic cache update hooks for WebSocket events
  const addDriftToCache = useAddDriftToCache()
  const updateDriftInCache = useUpdateDriftInCache()

  // WebSocket subscriptions (runs once on mount)
  useEffect(() => {
    const channel = supabase
      .channel('drift_events_changes_drifts_page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drift_events',
        },
        (payload) => {
          const newDrift = payload.new as DriftEvent

          // Add toast notification for HIGH/CRITICAL drifts
          if (newDrift.severity === 'HIGH' || newDrift.severity === 'CRITICAL') {
            addToast({
              title: `${newDrift.severity} Drift Detected!`,
              message: `${newDrift.resource_type}: ${newDrift.resource_id} (${newDrift.change_type})`,
              type: newDrift.severity === 'CRITICAL' ? 'error' : 'warning',
              duration: 10000,
            })
          }

          // Add to cache and let React Query handle filtering
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
          <h2 className="text-2xl font-bold text-text-primary">All Drift Events</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Filter and search all configuration drift events
          </p>
        </div>

        <div className="mb-6 bg-surface shadow rounded-lg p-4 border border-border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) =>
                  setFilters({ ...filters, severity: e.target.value })
                }
                className="block w-full pl-3 pr-10 py-2 text-base bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-aws-orange sm:text-sm rounded-md transition-colors"
              >
                <option value="all">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Resource Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-aws-orange sm:text-sm rounded-md transition-colors"
              >
                <option value="all">All</option>
                <option value="EC2">EC2</option>
                <option value="SecurityGroup">Security Group</option>
                <option value="RDS">RDS</option>
                <option value="S3">S3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={filters.acknowledged}
                onChange={(e) =>
                  setFilters({ ...filters, acknowledged: e.target.value })
                }
                className="block w-full pl-3 pr-10 py-2 text-base bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-aws-orange sm:text-sm rounded-md transition-colors"
              >
                <option value="all">All</option>
                <option value="false">Pending</option>
                <option value="true">Acknowledged</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
            <p className="mt-2 text-sm text-text-secondary">Loading...</p>
          </div>
        ) : (
          <DriftTable drifts={drifts} onDriftAcknowledged={() => refetch()} />
        )}
      </div>
    </>
  )
}
