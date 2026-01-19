import { DriftEvent } from '../app/page'
import { formatTimestamp, getSeverityColor, getChangeTypeColor } from '../lib/utils'

interface DriftTableProps {
  drifts: DriftEvent[]
}

export function DriftTable({ drifts }: DriftTableProps) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
