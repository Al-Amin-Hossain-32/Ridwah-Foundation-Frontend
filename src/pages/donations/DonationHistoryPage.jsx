import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchMyDonations, selectMyDonations, selectDonationLoad } from '@/app/store/donationSlice'
import { Card }        from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState }   from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function DonationHistoryPage() {
  const dispatch  = useAppDispatch()
  const donations = useAppSelector(selectMyDonations)
  const loading   = useAppSelector(selectDonationLoad)

  useEffect(() => {
    dispatch(fetchMyDonations())
  }, [dispatch])

  return (
    <div className="page-wrapper">
      <h2 className="font-heading text-text-main mb-lg">আমার Donations</h2>

      {loading ? (
        <CardSkeleton count={3} />
      ) : donations.length > 0 ? (
        <div className="space-y-3">
          {donations.map((d) => (
            <Card key={d._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-main text-small truncate">
                    {d.campaign?.title || 'Campaign'}
                  </p>
                  <p className="text-[13px] text-text-secondary mt-xs">
                    {d.paymentMethod} • {formatDate(d.createdAt)}
                  </p>
                  {d.transactionId && (
                    <p className="text-[12px] text-text-light mt-xs">
                      TXN: {d.transactionId}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-xs flex-shrink-0">
                  <p className="font-heading font-bold text-primary">
                    {formatCurrency(d.amount)}
                  </p>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="💝"
          title="এখনো কোনো donation করেননি"
          description="আজই একটি campaign এ donate করুন"
        />
      )}
    </div>
  )
}
