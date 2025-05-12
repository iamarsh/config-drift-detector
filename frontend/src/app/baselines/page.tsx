'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import { formatTimestamp } from '../../lib/utils'
import { logger } from '../../lib/logger'

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
  const [baselines, setBaselines] = useState<Baseline[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingBaseline, setCreatingBaseline] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchBaselines()
  }, [])

  async function fetchBaselines() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('baselines')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBaselines(data || [])
      setBaseline(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      logger.error('Error fetching baselines:', error)
      setBaselines([])
      setBaseline(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBaseline() {
    const confirmed = window.confirm(
      'Create a new baseline from the latest snapshot?\n\n' +
      'This will update the baseline used for drift detection. ' +
      'The detect Lambda will automatically create a baseline from the next snapshot (runs every 30 minutes at :05 and :35).\n\n' +
      'Alternatively, you can manually trigger the detect Lambda in AWS Console.'
    )

    if (!confirmed) return

    setCreatingBaseline(true)

    // Display helpful information
    alert(
      'Baseline Creation Options:\n\n' +
      '1. AUTOMATIC: Wait for next detect Lambda execution (runs at :05 and :35)\n' +
      '2. MANUAL: Invoke detect Lambda in AWS Console:\n' +
      '   aws lambda invoke --function-name config-drift-detector-prod-detect response.json\n\n' +
      'The page will refresh automatically to show the new baseline once created.'
    )

    // Set up auto-refresh to check for new baseline
    const refreshInterval = setInterval(async () => {
      const { data } = await supabase
        .from('baselines')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data[0] && (!baseline || data[0].id !== baseline.id)) {
        // New baseline detected!
        clearInterval(refreshInterval)
        await fetchBaselines()
        alert('New baseline detected and loaded!')
        setCreatingBaseline(false)
      }
    }, 10000) // Check every 10 seconds

    // Auto-stop after 5 minutes
    setTimeout(() => {
      clearInterval(refreshInterval)
      setCreatingBaseline(false)
    }, 300000)
  }

  function handleDownloadJSON() {
    if (!baseline) return

    const dataStr = JSON.stringify(baseline.snapshot, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `baseline-${baseline.created_at}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Baseline Configuration</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Current baseline snapshot used for drift detection
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aws-orange transition-all"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          <button
            onClick={handleDownloadJSON}
            disabled={!baseline}
            className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aws-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download JSON
          </button>
          <button
            onClick={handleCreateBaseline}
            disabled={creatingBaseline}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-aws-orange hover:bg-aws-orange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aws-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {creatingBaseline ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Set New Baseline
              </>
            )}
          </button>
        </div>
      </div>

      {showHistory && baselines.length > 1 && (
        <div className="mb-6 bg-surface shadow overflow-hidden sm:rounded-lg border border-border">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-text-primary">
              Baseline History ({baselines.length} total)
            </h3>
          </div>
          <div className="border-t border-border">
            <div className="flow-root px-4 py-4">
              <ul className="-mb-8">
                {baselines.map((b, idx) => (
                  <li key={b.id}>
                    <div className="relative pb-8">
                      {idx !== baselines.length - 1 && (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div>
                          <div className={`relative px-1 ${idx === 0 ? 'bg-aws-orange' : 'bg-surface-elevated border-2 border-border'} h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-surface`}>
                            {idx === 0 ? (
                              <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              <span className={`font-medium ${idx === 0 ? 'text-aws-orange' : 'text-text-primary'}`}>
                                {idx === 0 ? 'Current Baseline' : `Baseline ${baselines.length - idx}`}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-text-secondary">
                              Created {formatTimestamp(b.created_at)}
                            </p>
                            <p className="mt-0.5 text-xs text-text-tertiary">
                              {b.snapshot.resources.length} resources captured
                            </p>
                          </div>
                          {idx !== 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => setBaseline(b)}
                                className="text-xs text-aws-orange hover:text-aws-orange/80 font-medium"
                              >
                                View this baseline →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
