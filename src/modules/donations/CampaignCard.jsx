import { Link } from 'react-router-dom'
import { Calendar, Target } from 'lucide-react'
import { Card }        from '@/components/ui/Card'
import { Button }      from '@/components/ui/Button'
import { Badge }       from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency, daysLeft } from '@/utils/formatters'

/**
 * CampaignCard — ⑤ Card Design System
 * Campaign list + home featured campaigns এ use হয়
 */
export function CampaignCard({ campaign }) {
  const {
    _id, title, description,
    coverImage, goalAmount, raisedAmount,
    endDate, isActive,
  } = campaign

  const remaining = daysLeft(endDate)

  return (
    <Card padding={false}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-44 overflow-hidden rounded-t-card">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={isActive ? 'success' : 'default'}>
              {isActive ? 'Active' : 'Closed'}
            </Badge>
          </div>
          {/* Days left */}
          {remaining !== null && isActive && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <Calendar size={12} className="text-white" />
              <span className="text-white text-[12px] font-medium">
                {remaining > 0 ? `${remaining} দিন বাকি` : 'শেষ হয়েছে'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-md">
        <h3 className="font-heading font-semibold text-text-main leading-snug mb-xs line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-small text-text-secondary line-clamp-2 mb-md">
            {description}
          </p>
        )}

        {/* ⑧ Progress Bar */}
        <ProgressBar raised={raisedAmount} goal={goalAmount} className="mb-sm" />

        {/* Goal info */}
        <div className="flex items-center justify-between text-small text-text-secondary mb-md">
          <span className="flex items-center gap-1">
            <Target size={13} className="text-primary" />
            Goal: <strong className="text-text-main">{formatCurrency(goalAmount)}</strong>
          </span>
          <span>{formatCurrency(raisedAmount)} raised</span>
        </div>

        {/* Action */}
        <div className="flex gap-sm">
          <Link to={`/app/donate/${_id}`} className="flex-1">
            <Button variant="secondary" size="full">
              Details
            </Button>
          </Link>
          {isActive && (
            <Link to={`/app/donate/${_id}/pay`} className="flex-1">
              <Button variant="donate" size="full">
                Donate করুন
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
