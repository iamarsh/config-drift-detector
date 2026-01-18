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
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 truncate">
                Total Drifts
              </div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">
                {total}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-red-500 truncate">
                Critical
              </div>
              <div className="mt-1 text-3xl font-semibold text-red-600">
                {critical}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-orange-500 truncate">
                High
              </div>
              <div className="mt-1 text-3xl font-semibold text-orange-600">
                {high}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-500 truncate">
                Medium
              </div>
              <div className="mt-1 text-3xl font-semibold text-yellow-600">
                {medium}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 truncate">
                Unacknowledged
              </div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">
                {unacknowledged}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
