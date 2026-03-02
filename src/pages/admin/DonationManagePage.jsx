import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle, XCircle, Eye, Filter, Search,
  ChevronDown, Clock, User, Banknote, Image,
  X, AlertCircle, RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchAllDonations, approveDonation, rejectDonation,
  selectAllDonations, selectDonationLoad, selectPendingCount,
} from '@/app/store/donationSlice'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ── Payment method label ───────────────────────────────────────────────────────
const METHOD_LABELS = {
  bkash: { label: 'bKash',  color: 'bg-pink-100 text-pink-700' },
  nagad: { label: 'Nagad',  color: 'bg-orange-100 text-orange-700' },
  rocket:{ label: 'Rocket', color: 'bg-purple-100 text-purple-700' },
  bank:  { label: 'Bank',   color: 'bg-blue-100 text-blue-700' },
  cash:  { label: 'Cash',   color: 'bg-gray-100 text-gray-700' },
}

const STATUS_STYLES = {
  pending:   'bg-donate/10 text-donate-dark',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-600',
  refunded:  'bg-purple-100 text-purple-700',
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROOF IMAGE MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ProofModal({ url, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-text-main text-small">Payment Proof</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <X size={18} className="text-text-secondary" />
            </button>
          </div>
          <img src={url} alt="payment proof" className="w-full object-contain max-h-[65vh]" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REJECT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function RejectModal({ donation, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end justify-center"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 250 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl"
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-text-main">Donation বাতিল করুন</p>
              <p className="text-[12px] text-text-secondary">
                {formatCurrency(donation?.amount)} — {donation?.donor?.name || donation?.guestDonorInfo?.name || 'Guest'}
              </p>
            </div>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="বাতিলের কারণ লিখুন (optional)..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-small text-text-main resize-none focus:outline-none focus:border-primary transition-colors"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-small font-medium text-text-secondary hover:bg-gray-50 transition-colors"
            >
              বাতিল
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-small font-bold hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'প্রক্রিয়া...' : 'বাতিল করুন'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DONATION ROW CARD
// ═══════════════════════════════════════════════════════════════════════════════
function DonationCard({ donation, onApprove, onReject, onViewProof, actionId }) {
  const isProcessing = actionId === donation._id
  const method = METHOD_LABELS[donation.paymentMethod] || { label: donation.paymentMethod, color: 'bg-gray-100 text-gray-700' }
  const donorName = donation.donor?.name || donation.guestDonorInfo?.name || 'Guest Donor'
  const donorEmail = donation.donor?.email || donation.guestDonorInfo?.email || ''
  const donerProfilePicture = donation.donor?.profilePicture || donation.guestDonorInfo?.profilePicture
  const isAnonymous = donation.isAnonymous
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
    >
      {/* Top row */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className={cn('relative rounded-full overflow-hidden', isAnonymous ? 'w-10 h-10 bg-gray-300' : 'w-10 h-10')}>
            
          {donerProfilePicture
          ? <img src={donerProfilePicture} alt={donorName} className="w-full h-full object-cover" />
          : <User size={18} className="text-primary" />
        }

          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-main text-small truncate">{donorName}</p>
            <p className="text-[12px] text-text-light truncate">{donorEmail}</p>
          </div>
        </div>
        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="font-heading font-bold text-primary text-[18px]">
            {formatCurrency(donation.amount)}
          </p>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', STATUS_STYLES[donation.status])}>
            {donation.status}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full', method.color)}>
          {method.label}
        </span>
        {donation.paymentReference && (
          <span className="text-[11px] text-text-light bg-gray-50 px-2.5 py-1 rounded-full font-mono">
            {donation.paymentReference}
          </span>
        )}
        {donation.campaign && (
          <span className="text-[11px] text-primary bg-primary/5 px-2.5 py-1 rounded-full truncate max-w-[140px]">
            {donation.campaign.title}
          </span>
        )}
        <span className="text-[11px] text-text-light ml-auto">
          {formatDate(donation.createdAt)}
        </span>
      </div>

      {/* Message */}
      {donation.message && (
        <div className="mx-4 mb-3 px-3 py-2 bg-gray-50 rounded-xl">
          <p className="text-[12px] text-text-secondary italic">"{donation.message}"</p>
        </div>
      )}

      {/* Action row — only for pending */}
      {donation.status === 'pending' && (
        <div className="flex gap-2 px-4 pb-4">
          {/* View proof */}
          {donation.paymentProof?.url && (
            <button
              onClick={() => onViewProof(donation.paymentProof.url)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-text-secondary text-[12px] font-medium hover:bg-gray-100 transition-colors"
            >
              <Image size={14} />
              Proof
            </button>
          )}
          {/* Reject */}
          <button
            onClick={() => onReject(donation)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-small font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle size={16} />
            বাতিল
          </button>
          {/* Approve */}
          <button
            onClick={() => onApprove(donation._id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary text-white text-small font-bold hover:bg-secondary-light transition-colors disabled:opacity-50 shadow-sm"
          >
            {isProcessing
              ? <RefreshCw size={16} className="animate-spin" />
              : <CheckCircle size={16} />
            }
            অনুমোদন
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DonationManagePage() {
  const dispatch     = useAppDispatch()
  const donations    = useAppSelector(selectAllDonations)
  const loading      = useAppSelector(selectDonationLoad)
  const pendingCount = useAppSelector(selectPendingCount)

  const [filter,    setFilter]    = useState('pending')
  const [search,    setSearch]    = useState('')
  const [proofUrl,  setProofUrl]  = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [actionId,  setActionId]  = useState(null) // which donation is processing

  // Load donations on filter change
  useEffect(() => {
    dispatch(fetchAllDonations({ status: filter || undefined }))
  }, [dispatch, filter])

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (id) => {
    setActionId(id)
    const result = await dispatch(approveDonation(id))
    setActionId(null)
    if (approveDonation.fulfilled.match(result)) {
      toast.success('Donation অনুমোদিত হয়েছে ✓')
    } else {
      toast.error('অনুমোদন করা যায়নি')
    }
  }, [dispatch])

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleRejectConfirm = useCallback(async (reason) => {
    if (!rejectTarget) return
    setActionId(rejectTarget._id)
    const result = await dispatch(rejectDonation({ id: rejectTarget._id, reason }))
    setActionId(null)
    setRejectTarget(null)
    if (rejectDonation.fulfilled.match(result)) {
      toast.success('Donation বাতিল করা হয়েছে')
    } else {
      toast.error('বাতিল করা যায়নি')
    }
  }, [dispatch, rejectTarget])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = donations.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.donor?.name?.toLowerCase().includes(q) ||
      d.guestDonorInfo?.name?.toLowerCase().includes(q) ||
      d.paymentReference?.toLowerCase().includes(q) ||
      d.campaign?.title?.toLowerCase().includes(q)
    )
  })

  const FILTERS = [
    { value: 'pending',   label: 'অপেক্ষমাণ', count: pendingCount },
    { value: 'completed', label: 'অনুমোদিত' },
    { value: 'failed',    label: 'বাতিলকৃত' },
    { value: '',          label: 'সবগুলো' },
  ]

  return (
    <div className="space-y-md pb-8">

      {/* ── Header ── */}
      <div>
        <h2 className="font-heading font-bold text-text-main text-h2">Donation অনুমোদন</h2>
        <p className="text-small text-text-secondary mt-xs">Payment verify করে অনুমোদন দিন</p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-small font-semibold whitespace-nowrap transition-all flex-shrink-0',
              filter === f.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-secondary border border-gray-200 hover:border-primary/30'
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                filter === f.value ? 'bg-white/20' : 'bg-donate/10 text-donate-dark'
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম, TXN ID বা campaign খুঁজুন..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-small text-text-main bg-white focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={28} className="text-text-light" />
          </div>
          <p className="font-semibold text-text-secondary">কোনো donation পাওয়া যায়নি</p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((d) => (
              <DonationCard
                key={d._id}
                donation={d}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                onViewProof={setProofUrl}
                actionId={actionId}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modals ── */}
      {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}
      {rejectTarget && (
        <RejectModal
          donation={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
          loading={!!actionId}
        />
      )}
    </div>
  )
}