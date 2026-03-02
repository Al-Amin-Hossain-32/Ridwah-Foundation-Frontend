import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Filter, Receipt, Download, X,
  CheckCircle, Clock, XCircle, AlertTriangle,
  ChevronDown, Calendar, Banknote, RefreshCw,
  Heart, ArrowRight, SlidersHorizontal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchMyDonations, selectMyDonations, selectDonationLoad,
} from '@/app/store/donationSlice'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ─── Config ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { icon: Clock,         label: 'অপেক্ষমাণ',  color: 'text-donate',    bg: 'bg-donate/10',    border: 'border-donate/20'    },
  completed: { icon: CheckCircle,   label: 'সম্পন্ন',    color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  failed:    { icon: XCircle,       label: 'বাতিল',      color: 'text-red-500',   bg: 'bg-red-50',       border: 'border-red-200'      },
  refunded:  { icon: AlertTriangle, label: 'ফেরত',       color: 'text-purple-500',bg: 'bg-purple-50',    border: 'border-purple-200'   },
}

const METHOD_STYLES = {
  bkash:  { label: 'bKash',  color: 'bg-pink-100 text-pink-700'     },
  nagad:  { label: 'Nagad',  color: 'bg-orange-100 text-orange-700' },
  rocket: { label: 'Rocket', color: 'bg-violet-100 text-violet-700' },
  bank:   { label: 'Bank',   color: 'bg-blue-100 text-blue-700'     },
  cash:   { label: 'Cash',   color: 'bg-gray-100 text-gray-600'     },
}

const SORT_OPTIONS = [
  { value: 'newest',  label: 'সবচেয়ে নতুন' },
  { value: 'oldest',  label: 'সবচেয়ে পুরনো' },
  { value: 'highest', label: 'সর্বোচ্চ পরিমাণ' },
  { value: 'lowest',  label: 'সর্বনিম্ন পরিমাণ' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
const safeArr = (v) => (Array.isArray(v) ? v : [])

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIPT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ReceiptModal({ donation, onClose }) {
  const status = STATUS_CONFIG[donation.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const method = METHOD_STYLES[donation.paymentMethod] || { label: donation.paymentMethod, color: 'bg-gray-100 text-gray-600' }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-white rounded-t-[2rem] overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Receipt header */}
        <div className={cn(
          'mx-4 mt-3 rounded-2xl p-5 border',
          status.bg, status.border
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusIcon size={18} className={status.color} />
              <span className={cn('font-semibold text-small', status.color)}>{status.label}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
              <X size={16} className="text-text-secondary" />
            </button>
          </div>
          <p className="font-heading font-black text-text-main text-[32px] leading-none">
            {formatCurrency(donation.amount)}
          </p>
          <p className="text-small text-text-secondary mt-1">
            {donation.campaign?.title || 'General Donation'}
          </p>
        </div>

        {/* Receipt body */}
        <div className="px-4 py-4 space-y-0">
          {[
            { label: 'তারিখ',           value: formatDate(donation.createdAt) },
            { label: 'Payment Method',  value: <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', method.color)}>{method.label}</span> },
            ...(donation.paymentReference ? [{ label: 'Reference',    value: donation.paymentReference }] : []),
            ...(donation.transactionId   ? [{ label: 'Transaction ID',value: <span className="font-mono text-[12px] text-text-main">{donation.transactionId}</span> }] : []),
            ...(donation.approvedAt      ? [{ label: 'অনুমোদন',       value: formatDate(donation.approvedAt) }] : []),
            ...(donation.approvedBy?.name? [{ label: 'অনুমোদনকারী',   value: donation.approvedBy.name }] : []),
            ...(donation.rejectionReason ? [{ label: 'বাতিলের কারণ',  value: <span className="text-red-500">{donation.rejectionReason}</span> }] : []),
            ...(donation.message         ? [{ label: 'বার্তা',         value: <span className="italic">"{donation.message}"</span> }] : []),
            { label: 'Anonymous',       value: donation.isAnonymous ? 'হ্যাঁ' : 'না' },
          ].map((row, i) => (
            <div key={i} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
              <span className="text-[12px] text-text-secondary flex-shrink-0 w-32">{row.label}</span>
              <span className="text-[12px] font-medium text-text-main text-right flex-1">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Payment proof */}
        {donation.paymentProof?.url && (
          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-text-secondary mb-2">Payment Proof</p>
            <img
              src={donation.paymentProof.url}
              alt="payment proof"
              className="w-full h-36 object-cover rounded-xl border border-gray-100"
            />
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function FilterDrawer({ filters, onChange, onClose }) {
  const [local, setLocal] = useState(filters)
  const set = (k, v) => setLocal((p) => ({ ...p, [k]: v }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-white rounded-t-[2rem] p-6"
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-text-main">Filter করুন</h3>
          <button
            onClick={() => { onChange({ status: '', method: '', sort: 'newest' }); onClose() }}
            className="text-[12px] text-primary font-medium"
          >
            Reset
          </button>
        </div>

        {/* Sort */}
        <div className="mb-5">
          <p className="text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wide">সাজানো</p>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => set('sort', s.value)}
                className={cn(
                  'py-2.5 rounded-xl text-small font-medium border-2 transition-all',
                  local.sort === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-100 text-text-secondary hover:border-gray-200'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div className="mb-6">
          <p className="text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wide">Payment Method</p>
          <div className="flex flex-wrap gap-2">
            {[{ value: '', label: 'সবগুলো' }, ...Object.entries(METHOD_STYLES).map(([k, v]) => ({ value: k, label: v.label }))].map((m) => (
              <button
                key={m.value}
                onClick={() => set('method', m.value)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-small font-semibold border-2 transition-all',
                  local.method === m.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-100 text-text-secondary'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { onChange(local); onClose() }}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-small"
        >
          প্রয়োগ করুন
        </button>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DONATION CARD
// ═══════════════════════════════════════════════════════════════════════════════
function DonationCard({ donation, onViewReceipt, delay }) {
  const status = STATUS_CONFIG[donation.status] || STATUS_CONFIG.pending
  const method = METHOD_STYLES[donation.paymentMethod] || { label: donation.paymentMethod, color: 'bg-gray-100 text-gray-600' }
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'bg-white rounded-2xl border shadow-card overflow-hidden',
        status.border
      )}
    >
      {/* Left accent strip */}
      <div className="flex">
        <div className={cn('w-1 flex-shrink-0', status.bg.replace('bg-', 'bg-').replace('/10', ''))} />

        <div className="flex-1 px-4 py-4">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-main text-small truncate">
                {donation.campaign?.title || 'General Donation'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', method.color)}>
                  {method.label}
                </span>
                <span className="text-[11px] text-text-light">{formatDate(donation.createdAt)}</span>
                {donation.isAnonymous && (
                  <span className="text-[10px] text-text-light bg-gray-50 px-2 py-0.5 rounded-full">Anonymous</span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-heading font-black text-primary text-[18px] leading-tight">
                {formatCurrency(donation.amount)}
              </p>
              <div className={cn('flex items-center justify-end gap-1 mt-1', status.color)}>
                <StatusIcon size={11} />
                <span className="text-[10px] font-semibold">{status.label}</span>
              </div>
            </div>
          </div>

          {/* TXN ID */}
          {donation.transactionId && (
            <p className="text-[11px] text-text-light font-mono mt-2 bg-gray-50 rounded-lg px-2.5 py-1.5 truncate">
              {donation.transactionId}
            </p>
          )}

          {/* Rejection reason */}
          {donation.status === 'failed' && donation.rejectionReason && (
            <p className="text-[11px] text-red-500 mt-2 bg-red-50 rounded-lg px-2.5 py-1.5">
              কারণ: {donation.rejectionReason}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <p className="text-[11px] text-text-light">
              {donation.donationType === 'recurring' ? '🔄 Recurring' : '💛 One-time'}
            </p>
            <button
              onClick={() => onViewReceipt(donation)}
              className="flex items-center gap-1.5 text-[12px] text-primary font-semibold hover:underline"
            >
              <Receipt size={13} />
              বিবরণ দেখুন
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function SummaryBanner({ donations }) {
  const arr = safeArr(donations)
  const completed = arr.filter((d) => d.status === 'completed')
  const total     = completed.reduce((s, d) => s + d.amount, 0)
  const pending   = arr.filter((d) => d.status === 'pending').length

  if (arr.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {[
        { label: 'মোট দান',     value: formatCurrency(total),   color: 'text-primary'   },
        { label: 'সম্পন্ন',     value: completed.length,         color: 'text-secondary' },
        { label: 'অপেক্ষমাণ',  value: pending,                  color: 'text-donate'    },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center"
        >
          <p className={cn('font-heading font-black text-[18px] leading-none', s.color)}>{s.value}</p>
          <p className="text-[11px] text-text-secondary mt-1">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DonationHistoryPage() {
  const dispatch  = useAppDispatch()
  const rawList   = useAppSelector(selectMyDonations)
  const loading   = useAppSelector(selectDonationLoad)

  // Defensive: always array
  const donations = safeArr(rawList)

  const [search,   setSearch]   = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [filters,  setFilters]  = useState({ status: '', method: '', sort: 'newest' })
  const [showFilter, setShowFilter] = useState(false)
  const [receipt,  setReceipt]  = useState(null)

  useEffect(() => { dispatch(fetchMyDonations()) }, [dispatch])

  // ── Filter + sort pipeline ─────────────────────────────────────────────────
  const processed = useMemo(() => {
    let list = [...donations]

    // Status tab
    if (statusTab !== 'all') list = list.filter((d) => d.status === statusTab)

    // Method filter
    if (filters.method) list = list.filter((d) => d.paymentMethod === filters.method)

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) =>
        d.campaign?.title?.toLowerCase().includes(q) ||
        d.transactionId?.toLowerCase().includes(q)   ||
        d.paymentReference?.toLowerCase().includes(q)
      )
    }

    // Sort
    switch (filters.sort) {
      case 'oldest':  list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break
      case 'highest': list.sort((a, b) => b.amount - a.amount); break
      case 'lowest':  list.sort((a, b) => a.amount - b.amount); break
      default:        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return list
  }, [donations, statusTab, filters, search])

  // Active filter count badge
  const activeFilters = [filters.method, filters.sort !== 'newest' ? '1' : ''].filter(Boolean).length

  const STATUS_TABS = [
    { value: 'all',       label: 'সবগুলো',    count: donations.length },
    { value: 'completed', label: 'সম্পন্ন',   count: donations.filter((d) => d.status === 'completed').length },
    { value: 'pending',   label: 'অপেক্ষমাণ', count: donations.filter((d) => d.status === 'pending').length  },
    { value: 'failed',    label: 'বাতিল',     count: donations.filter((d) => d.status === 'failed').length   },
  ]

  return (
    <div className="space-y-md pb-8">

      {/* ── Header ── */}
      <div>
        <h2 className="font-heading font-bold text-text-main text-h2">Donation ইতিহাস</h2>
        <p className="text-small text-text-secondary mt-xs">আমার সব donation এর রেকর্ড</p>
      </div>

      {/* ── Summary ── */}
      <SummaryBanner donations={donations} />

      {/* ── Status tabs ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusTab(t.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-small font-semibold whitespace-nowrap transition-all flex-shrink-0',
              statusTab === t.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-secondary border border-gray-200'
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none',
                statusTab === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-text-secondary'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + Filter row ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Campaign বা TXN ID খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-small text-text-main bg-white focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={13} className="text-text-light" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className={cn(
            'relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-small font-semibold transition-all',
            activeFilters > 0
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-text-secondary border-gray-200 hover:border-primary/30'
          )}
        >
          <SlidersHorizontal size={15} />
          Filter
          {activeFilters > 0 && (
            <span className="w-4 h-4 bg-white/30 rounded-full text-[9px] font-black flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* ── Result count ── */}
      {!loading && (
        <p className="text-[12px] text-text-light px-1">
          {processed.length}টি donation দেখাচ্ছে
          {search && ` — "${search}" এর জন্য`}
        </p>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : processed.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-primary/30" />
          </div>
          <p className="font-semibold text-text-secondary">
            {search ? `"${search}" এর জন্য কিছু পাওয়া যায়নি` : 'কোনো donation নেই'}
          </p>
          {!search && (
            <Link to="/app/donate" className="inline-flex items-center gap-1.5 mt-3 text-primary text-small font-medium">
              এখনই donate করুন <ArrowRight size={13} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {processed.map((d, i) => (
              <DonationCard
                key={d._id}
                donation={d}
                onViewReceipt={setReceipt}
                delay={i * 0.03}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {receipt    && <ReceiptModal donation={receipt} onClose={() => setReceipt(null)} />}
        {showFilter && <FilterDrawer filters={filters} onChange={setFilters} onClose={() => setShowFilter(false)} />}
      </AnimatePresence>
    </div>
  )
}