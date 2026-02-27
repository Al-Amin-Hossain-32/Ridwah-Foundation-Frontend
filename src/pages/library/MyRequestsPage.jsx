import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchMyRequests, selectMyRequests } from '@/app/store/bookSlice'
import bookRequestService from '@/services/bookRequest.service'
import { Card }       from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button }     from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'

export default function MyRequestsPage() {
  const dispatch  = useAppDispatch()
  const requests  = useAppSelector(selectMyRequests)

  useEffect(() => {
    dispatch(fetchMyRequests())
  }, [dispatch])

  const handleCancel = async (id) => {
    try {
      await bookRequestService.cancel(id)
      toast.success('Request cancel করা হয়েছে')
      dispatch(fetchMyRequests())
    } catch {
      toast.error('Cancel করা যায়নি')
    }
  }

  return (
    <div className="page-wrapper">
      <h2 className="font-heading text-text-main mb-lg">আমার Book Requests</h2>

      {requests.length === 0 ? (
        <EmptyState icon="📖" title="কোনো request নেই" />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req._id}>
              <div className="flex items-start justify-between gap-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-main text-small truncate">
                    {req.book?.title}
                  </p>
                  <p className="text-[13px] text-text-secondary mt-xs">
                    {req.book?.author}
                  </p>
                  <p className="text-[12px] text-text-light mt-xs">
                    {formatDate(req.createdAt)}
                  </p>
                  {req.dueDate && (
                    <p className="text-[12px] text-primary mt-xs">
                      Due: {formatDate(req.dueDate)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-sm">
                  <StatusBadge status={req.status} />
                  {req.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancel(req._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
