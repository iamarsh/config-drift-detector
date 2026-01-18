'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import { DriftTable } from '../../components/drift-table'
import { DriftEvent } from '../page'

export default function DriftsPage() {
  const [drifts, setDrifts] = useState<DriftEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    acknowledged: 'all',
  })

  useEffect(() => {
    fetchDrifts()
  }, [filters])

  async function fetchDrifts() {
    try {
      setLoading(true)

      let query = supabase
        .from('drift_events')
        .select('*')
        .order('detected_at', { ascending: false })

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity)
      }

      if (filters.type !== 'all') {
        query = query.eq('resource_type', filters.type)
      }

      if (filters.acknowledged !== 'all') {
        query = query.eq('acknowledged', filters.acknowledged === 'true')
      }

      const { data, error } = await query

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
        <h2 className="text-2xl font-bold text-gray-900">All Drift Events</h2>
        <p className="mt-1 text-sm text-gray-500">
          Filter and search all configuration drift events
        </p>
      </div>

      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) =>
                setFilters({ ...filters, severity: e.target.value })
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="EC2">EC2</option>
              <option value="SecurityGroup">Security Group</option>
              <option value="RDS">RDS</option>
              <option value="S3">S3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.acknowledged}
              onChange={(e) =>
                setFilters({ ...filters, acknowledged: e.target.value })
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="false">Pending</option>
              <option value="true">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      ) : (
        <DriftTable drifts={drifts} />
      )}
    </div>
  )
}
