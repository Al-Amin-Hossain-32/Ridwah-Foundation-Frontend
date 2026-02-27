import { progressPercent, formatCurrency } from '@/utils/formatters'

/**
 * ProgressBar — ⑧ Campaign Progress
 * bg: light gray, fill: emerald green (#10B981), height: 8px
 */
export function ProgressBar({
  raised      = 0,
  goal        = 1,
  showLabels  = true,
  showPercent = true,
  className   = '',
}) {
  const percent = progressPercent(raised, goal)

  return (
    <div className={className}>
      {/* Track */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[13px] text-text-secondary">
            {formatCurrency(raised)} raised
          </span>
          {showPercent && (
            <span className="text-[13px] font-semibold text-primary">
              {percent}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
