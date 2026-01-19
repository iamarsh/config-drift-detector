import { DriftEvent } from '../app/page'

interface SummaryCardsProps {
  drifts: DriftEvent[]
}

export function SummaryCards({ drifts }: SummaryCardsProps) {
  const total = drifts.length

  const critical = drifts.filter((d) => d.severity === 'CRITICAL').length
  const high = drifts.filter((d) => d.severity === 'HIGH').length
  const medium = drifts.filter((d) => d.severity === 'MEDIUM').length
  const low = drifts.filter((d) => d.severity === 'LOW').length

  const unacknowledged = drifts.filter((d) => !d.acknowledged).length

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <div className="bg-surface overflow-hidden shadow rounded-lg border border-border">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-text-secondary truncate">
                Total Drifts
              </div>
              <div className="mt-1 text-3xl font-semibold text-text-primary">
                {total}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface overflow-hidden shadow rounded-lg border border-border">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-critical truncate">
                Critical
              </div>
              <div className="mt-1 text-3xl font-semibold text-critical">
                {critical}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface overflow-hidden shadow rounded-lg border border-border">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-high truncate">
                High
              </div>
              <div className="mt-1 text-3xl font-semibold text-high">
                {high}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface overflow-hidden shadow rounded-lg border border-border">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-medium truncate">
                Medium
              </div>
              <div className="mt-1 text-3xl font-semibold text-medium">
                {medium}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface overflow-hidden shadow rounded-lg border border-border">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-text-secondary truncate">
                Unacknowledged
              </div>
              <div className="mt-1 text-3xl font-semibold text-text-primary">
                {unacknowledged}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
