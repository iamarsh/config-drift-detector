import { DriftEvent } from '../app/page'
import { formatTimestamp, getSeverityColor, getChangeTypeColor } from '../lib/utils'
import { supabase } from '../lib/supabase-client'
import { useState } from 'react'

interface DriftTableProps {
  drifts: DriftEvent[]
  onDriftAcknowledged?: (driftId: string) => void
}

export function DriftTable({ drifts, onDriftAcknowledged }: DriftTableProps) {
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set())

  async function handleAcknowledge(driftId: string) {
    try {
      setAcknowledging(prev => new Set(prev).add(driftId))

      const { error } = await supabase
        .from('drift_events')
        .update({ acknowledged: true })
        .eq('id', driftId)

      if (error) throw error

      // Notify parent component to refresh data
      onDriftAcknowledged?.(driftId)
    } catch (error) {
      console.error('Error acknowledging drift:', error)
      alert('Failed to acknowledge drift. Please try again.')
    } finally {
      setAcknowledging(prev => {
        const newSet = new Set(prev)
        newSet.delete(driftId)
        return newSet
      })
    }
  }
  if (drifts.length === 0) {
    return (
      <div className="text-center py-12 bg-surface shadow rounded-lg border border-border">
        <p className="text-sm text-text-secondary">No drift events found</p>
      </div>
    )
  }

  return (
    <div className="bg-surface shadow overflow-hidden sm:rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-elevated">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Resource
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Change
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Severity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Detected
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {drifts.map((drift) => (
            <tr key={drift.id} className="hover:bg-surface-elevated transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                {drift.resource_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {drift.resource_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getChangeTypeColor(
                    drift.change_type
                  )}`}
                >
                  {drift.change_type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getSeverityColor(
                    drift.severity
                  )}`}
                >
                  {drift.severity}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {formatTimestamp(drift.detected_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {drift.acknowledged ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success border border-success/20">
                    Acknowledged
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-medium/10 text-medium border border-medium/20">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {!drift.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(drift.id)}
                    disabled={acknowledging.has(drift.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-aws-orange hover:bg-aws-orange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aws-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {acknowledging.has(drift.id) ? (
                      <>
                        <svg
                          className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Acknowledging...
                      </>
                    ) : (
                      <>
                        <svg
                          className="-ml-0.5 mr-1.5 h-3 w-3"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Acknowledge
                      </>
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
