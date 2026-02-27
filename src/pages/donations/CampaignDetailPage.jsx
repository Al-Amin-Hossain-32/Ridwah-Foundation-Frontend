import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Target, Users, ArrowLeft } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchCampaignById, selectCampaignById } from '@/app/store/campaignSlice'
import { Button }      from '@/components/ui/Button'
import { Card }        from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge }       from '@/components/ui/Badge'
import { Loader }      from '@/components/ui/Loader'
import { formatCurrency, daysLeft, formatDate } from '@/utils/formatters'

export default function CampaignDetailPage() {
  const { id }      = useParams()
  const dispatch    = useAppDispatch()
  const campaign    = useAppSelector(selectCampaignById)

  useEffect(() => {
    dispatch(fetchCampaignById(id))
  }, [dispatch, id])

  if (!campaign) {
    return <div className="page-wrapper flex justify-center"><Loader size="lg" className="mt-xl" /></div>
  }

  const {
    title, description, coverImage,
    goalAmount, raisedAmount, donorCount,
    endDate, isActive,
  } = campaign

  const remaining = daysLeft(endDate)

  return (
    <div className="page-wrapper">
      {/* Back */}
      <Link to="/app/donate" className="flex items-center gap-xs text-primary mb-md font-medium text-small">
        <ArrowLeft size={16} /> Campaigns
      </Link>

      {/* Cover */}
      {coverImage && (
        <img
          src={coverImage}
          alt={title}
          className="w-full h-52 object-cover rounded-card mb-md"
        />
      )}

      {/* Title + status */}
      <div className="flex items-start justify-between gap-sm mb-sm">
        <h2 className="font-heading text-text-main flex-1">{title}</h2>
        <Badge variant={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Closed'}
        </Badge>
      </div>

      {/* ⑧ Progress */}
      <ProgressBar raised={raisedAmount} goal={goalAmount} className="mb-md" />

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-sm mb-md">
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-primary text-[18px]">
            {formatCurrency(raisedAmount)}
          </p>
          <p className="text-[12px] text-text-secondary">Raised</p>
        </Card>
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-text-main text-[18px]">
            {formatCurrency(goalAmount)}
          </p>
          <p className="text-[12px] text-text-secondary">Goal</p>
        </Card>
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-text-main text-[18px]">
            {donorCount || 0}
          </p>
          <p className="text-[12px] text-text-secondary">Donors</p>
        </Card>
      </div>

      {/* End date */}
      {endDate && (
        <div className="flex items-center gap-xs text-small text-text-secondary mb-md">
          <Calendar size={15} className="text-primary" />
          <span>শেষ তারিখ: {formatDate(endDate)}</span>
          {remaining !== null && isActive && (
            <span className={`font-medium ${remaining <= 7 ? 'text-red-500' : 'text-text-main'}`}>
              ({remaining > 0 ? `${remaining} দিন বাকি` : 'আজ শেষ!'})
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <Card className="mb-md">
          <h3 className="font-heading text-text-main mb-sm">বিস্তারিত</h3>
          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </Card>
      )}

      {/* CTA */}
      {isActive && (
        <div className="fixed bottom-[64px] left-0 right-0 p-md bg-white/90 backdrop-blur-sm border-t border-gray-100">
          <Link to={`/app/donate/${id}/pay`}>
            <Button variant="donate" size="full" className="w-full">
              💛 এখনই Donate করুন
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
