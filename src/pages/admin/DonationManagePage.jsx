import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchAllDonations, approveDonation, rejectDonation, selectAllDonations } from '@/app/store/donationSlice'
import { Card }       from '@/components/ui/Card'
import { Button }     from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Modal }      from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function DonationManagePage() {
  const dispatch  = useAppDispatch()
  const donations = useAppSelector(selectAllDonations)
  const [loading,     setLoading]     = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [showDetail,  setShowDetail]  = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoad,  setActionLoad]  = useState(false)

  useEffect(() => {
    setLoading(true)
    dispatch(fetchAllDonations()).finally(() => setLoading(false))
  }, [dispatch])

  const handleApprove = async (id) => {
    setActionLoad(true)
    const result = await dispatch(approveDonation(id))
    if (approveDonation.fulfilled.match(result)) {
      toast.success('Donation approve করা হয়েছে!')
      setShowDetail(false)
    } else {
      toast.error('Approve করা যায়নি')
    }
    setActionLoad(false)
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { toast.error('Reason দিন'); return }
    setActionLoad(true)
    const result = await dispatch(rejectDonation({ id, reason: rejectReason }))
    if (rejectDonation.fulfilled.match(result)) {
      toast.success('Donation reject করা হয়েছে')
      setShowDetail(false)
      setRejectReason('')
    } else {
      toast.error('Reject করা যায়নি')
    }
    setActionLoad(false)
  }

  const openDetail = (donation) => {
    setSelected(donation)
    setShowDetail(true)
  }

  return (
    <div className="page-wrapper">
      <h2 className="font-heading text-text-main mb-lg">Donation Manage</h2>

      {/* Filter tabs */}
      <div className="flex gap-sm mb-md overflow-x-auto pb-xs">
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            className={`
              px-3 py-1.5 rounded-full text-small font-medium whitespace-nowrap transition-colors
              ${s === 'all' ? 'bg-primary text-white' : 'bg-white text-text-secondary border border-gray-200'}
            `}
          >
            {s === 'all' ? 'সব' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : donations.length > 0 ? (
        <div className="space-y-2">
          {donations.map((d) => (
            <Card key={d._id} className="flex items-center gap-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-xs">
                  <p className="font-semibold text-text-main text-small truncate">
                    {d.donor?.name || 'Anonymous'}
                  </p>
                  <p className="font-bold text-primary text-small flex-shrink-0">
                    {formatCurrency(d.amount)}
                  </p>
                </div>
                <p className="text-[13px] text-text-secondary truncate">
                  {d.campaign?.title}
                </p>
                <div className="flex items-center gap-sm mt-xs">
                  <StatusBadge status={d.status} />
                  <p className="text-[12px] text-text-light">{formatDate(d.createdAt)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-xs flex-shrink-0">
                {d.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(d._id)}
                      className="p-2 bg-green-50 text-secondary rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => openDetail(d)}
                      className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <XCircle size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => openDetail(d)}
                  className="p-2 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="📭" title="কোনো donation নেই" />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Donation Details"
        size="md"
      >
        {selected && (
          <div className="space-y-md">
            <div className="grid grid-cols-2 gap-sm">
              <div className="bg-gray-50 rounded-btn p-3">
                <p className="text-[12px] text-text-secondary">Donor</p>
                <p className="font-semibold text-text-main text-small">{selected.donor?.name}</p>
              </div>
              <div className="bg-gray-50 rounded-btn p-3">
                <p className="text-[12px] text-text-secondary">Amount</p>
                <p className="font-bold text-primary">{formatCurrency(selected.amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-btn p-3">
                <p className="text-[12px] text-text-secondary">Method</p>
                <p className="font-semibold text-text-main text-small">{selected.paymentMethod}</p>
              </div>
              <div className="bg-gray-50 rounded-btn p-3">
                <p className="text-[12px] text-text-secondary">Transaction</p>
                <p className="font-semibold text-text-main text-small truncate">{selected.transactionId}</p>
              </div>
            </div>

            {selected.proofImage && (
              <div>
                <p className="text-small text-text-secondary mb-xs">Payment Proof</p>
                <img src={selected.proofImage} alt="proof" className="w-full rounded-card max-h-60 object-contain bg-gray-50" />
              </div>
            )}

            {selected.status === 'pending' && (
              <div className="space-y-sm border-t border-gray-100 pt-md">
                <Button
                  onClick={() => handleApprove(selected._id)}
                  loading={actionLoad}
                  size="full"
                  variant="primary"
                >
                  <CheckCircle size={16} /> Approve করুন
                </Button>

                <div className="flex gap-sm">
                  <input
                    className="form-input flex-1 text-small"
                    placeholder="Rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <Button
                    onClick={() => handleReject(selected._id)}
                    loading={actionLoad}
                    variant="danger"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
