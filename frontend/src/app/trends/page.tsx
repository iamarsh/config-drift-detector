'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase-client'
import { ToastContainer, useToast } from '../../components/toast'
import {
  useDriftTrends,
  useAddDriftToCache,
  useUpdateDriftInCache,
  type DriftEvent,
} from '../../hooks/useDrifts'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TimeSeriesData {
  date: string
  count: number
  critical: number
  high: number
  medium: number
  low: number
}

interface ResourceTypeData {
  resourceType: string
  count: number
}

interface SeverityData {
  severity: string
  count: number
}

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const { toasts, addToast, dismissToast } = useToast()

  // Calculate daysAgo from timeRange
  const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

  // Use React Query hook for data fetching
  const {
    data: drifts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useDriftTrends(daysAgo)

  // Optimistic cache update hooks for WebSocket events
  const addDriftToCache = useAddDriftToCache()
  const updateDriftInCache = useUpdateDriftInCache()

  // WebSocket subscriptions with proper cleanup
  useEffect(() => {
    const channel = supabase
      .channel('drift_events_changes_trends_page')
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
          updateDriftInCache(updatedDrift)
        }
      )
      .subscribe()

    // Cleanup function to unsubscribe and remove channel
    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [addDriftToCache, updateDriftInCache, addToast])

  // Process time series data - MEMOIZED to prevent recalculation on every render
  const timeSeriesData: TimeSeriesData[] = useMemo(() => {
    const dataMap = new Map<string, TimeSeriesData>()

    drifts.forEach((drift) => {
      const date = new Date(drift.detected_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      if (!dataMap.has(date)) {
        dataMap.set(date, {
          date,
          count: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        })
      }

      const entry = dataMap.get(date)!
      entry.count++
      entry[drift.severity.toLowerCase() as keyof Omit<TimeSeriesData, 'date' | 'count'>]++
    })

    return Array.from(dataMap.values())
  }, [drifts])

  // Process resource type breakdown - MEMOIZED
  const resourceTypeData: ResourceTypeData[] = useMemo(() => {
    const typeMap = new Map<string, number>()

    drifts.forEach((drift) => {
      const count = typeMap.get(drift.resource_type) || 0
      typeMap.set(drift.resource_type, count + 1)
    })

    return Array.from(typeMap.entries())
      .map(([resourceType, count]) => ({ resourceType, count }))
      .sort((a, b) => b.count - a.count)
  }, [drifts])

  // Process severity breakdown - MEMOIZED
  const severityData: SeverityData[] = useMemo(() => {
    const severityMap = new Map<string, number>()

    drifts.forEach((drift) => {
      const count = severityMap.get(drift.severity) || 0
      severityMap.set(drift.severity, count + 1)
    })

    return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
      .filter((severity) => severityMap.has(severity))
      .map((severity) => ({
        severity,
        count: severityMap.get(severity) || 0,
      }))
  }, [drifts])

  // Top drifting resources - MEMOIZED
  const topResources = useMemo(() => {
    const resourceMap = new Map<string, number>()

    drifts.forEach((drift) => {
      const key = `${drift.resource_type}:${drift.resource_id}`
      const count = resourceMap.get(key) || 0
      resourceMap.set(key, count + 1)
    })

    return Array.from(resourceMap.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [drifts])

  const COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
          <p className="mt-2 text-sm text-text-secondary">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 bg-surface rounded-lg border border-critical/20 p-8">
          <svg
            className="mx-auto h-12 w-12 text-critical"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-text-primary">Failed to Load Analytics</h3>
          <p className="mt-2 text-sm text-text-secondary">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-4 py-2 bg-aws-orange text-white rounded-md hover:bg-aws-orange/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Drift Trends & Analytics</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Historical drift patterns and resource insights
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeRange === '7d'
                ? 'bg-aws-orange text-white'
                : 'bg-surface text-text-primary border border-border hover:bg-aws-orange/10'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeRange === '30d'
                ? 'bg-aws-orange text-white'
                : 'bg-surface text-text-primary border border-border hover:bg-aws-orange/10'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeRange === '90d'
                ? 'bg-aws-orange text-white'
                : 'bg-surface text-text-primary border border-border hover:bg-aws-orange/10'
            }`}
          >
            90 Days
          </button>

          {/* Manual refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-surface text-text-primary hover:bg-aws-orange/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Refresh data"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {drifts.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg border border-border">
          <p className="text-text-secondary">No drift data available for the selected time range</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-surface p-6 rounded-lg shadow border border-border">
              <div className="text-sm font-medium text-text-secondary">Total Drifts</div>
              <div className="mt-2 text-3xl font-semibold text-text-primary">{drifts.length}</div>
            </div>
            <div className="bg-surface p-6 rounded-lg shadow border border-border">
              <div className="text-sm font-medium text-text-secondary">Critical + High</div>
              <div className="mt-2 text-3xl font-semibold text-red-500">
                {drifts.filter((d) => d.severity === 'CRITICAL' || d.severity === 'HIGH').length}
              </div>
            </div>
            <div className="bg-surface p-6 rounded-lg shadow border border-border">
              <div className="text-sm font-medium text-text-secondary">Unique Resources</div>
              <div className="mt-2 text-3xl font-semibold text-text-primary">
                {new Set(drifts.map((d) => d.resource_id)).size}
              </div>
            </div>
            <div className="bg-surface p-6 rounded-lg shadow border border-border">
              <div className="text-sm font-medium text-text-secondary">Avg. Drifts/Day</div>
              <div className="mt-2 text-3xl font-semibold text-text-primary">
                {(drifts.length / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="bg-surface p-6 rounded-lg shadow border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Drift Frequency Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="critical" stroke={COLORS.CRITICAL} strokeWidth={2} name="Critical" />
                <Line type="monotone" dataKey="high" stroke={COLORS.HIGH} strokeWidth={2} name="High" />
                <Line type="monotone" dataKey="medium" stroke={COLORS.MEDIUM} strokeWidth={2} name="Medium" />
                <Line type="monotone" dataKey="low" stroke={COLORS.LOW} strokeWidth={2} name="Low" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Type Breakdown */}
            <div className="bg-surface p-6 rounded-lg shadow border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Drifts by Resource Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="resourceType" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#FF9900" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Distribution */}
            <div className="bg-surface p-6 rounded-lg shadow border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Severity Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.severity} ${(entry.percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.severity as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Drifting Resources */}
          <div className="bg-surface p-6 rounded-lg shadow border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Top 10 Most Frequently Changed Resources
            </h3>
            <div className="space-y-3">
              {topResources.map((item, index) => {
                const maxCount = topResources[0]?.count || 1
                const percentage = (item.count / maxCount) * 100

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {item.resource}
                      </span>
                      <span className="text-sm text-text-secondary ml-2">{item.count} drifts</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-aws-orange h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
