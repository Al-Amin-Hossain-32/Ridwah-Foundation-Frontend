import { useEffect, useState } from 'react'
import {
  RefreshCw, AlertTriangle, CheckCircle,
  PauseCircle, XCircle, User, Calendar,
  ChevronRight, TrendingUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchAllRecurring, fetchOverdueRecurring,
  selectAllRecurring, selectOverdue, selectRecurringLoad,
  selectRecurringPagination,
} from '@/app/store/recurringDonationSlice'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ── Frequency labels ───────────────────────────────────────────────────────────
const FREQ = {
  monthly:   { label: 'মাসিক',      color: 'bg-blue-100 text-blue-700' },
  quarterly: { label: 'ত্রৈমাসিক', color: 'bg-purple-100 text-purple-700' },
  yearly:    { label: 'বার্ষিক',    color: 'bg-green-100 text-green-700' },
}

const STATUS_STYLES = {
  active:    { label: 'সক্রিয়',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  paused:    { label: 'বিরতি',      color: 'bg-yellow-100 text-yellow-700', icon: PauseCircle },
  cancelled: { label: 'বাতিল',     color: 'bg-red-100 text-red-600',       icon: XCircle },
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERDUE CARD
// ═══════════════════════════════════════════════════════════════════════════════
function OverdueCard({ item }) {
  const daysOverdue = Math.floor((new Date() - new Date(item.nextDueDate)) / (1000 * 60 * 60 * 24))
  const freq = FREQ[item.frequency] || { label: item.frequency, color: 'bg-gray-100 text-gray-600' }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3"
    >
      <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-small font-semibold text-text-main truncate">
          {item.donor?.name || 'অজ্ঞাত'}
        </p>
        <p className="text-[11px] text-text-light truncate">{item.donor?.email}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-primary text-small">{formatCurrency(item.amount)}</p>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', freq.color)}>
          {freq.label}
        </span>
        <p className="text-[10px] text-red-500 font-medium mt-0.5">{daysOverdue} দিন বাকি</p>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING ROW
// ═══════════════════════════════════════════════════════════════════════════════
function RecurringRow({ item }) {
  const [expanded, setExpanded] = useState(false)
  const freq   = FREQ[item.frequency]   || { label: item.frequency, color: 'bg-gray-100 text-gray-600' }
  const status = STATUS_STYLES[item.status] || STATUS_STYLES.active
  const StatusIcon = status.icon

  return (
    <motion.div layout className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <User size={17} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-small font-semibold text-text-main truncate">
            {item.donor?.name || 'অজ্ঞাত'}
          </p>
          {item.campaign && (
            <p className="text-[11px] text-text-light truncate">{item.campaign.title}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-heading font-bold text-primary">{formatCurrency(item.amount)}</p>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', freq.color)}>
            {freq.label}
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-text-light ml-1" />
        </motion.div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
              {/* Status + stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center gap-1', status.color)}>
                    <StatusIcon size={9} />
                    {status.label}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-bold text-text-main text-small">{item.paymentCount || 0}</p>
                  <p className="text-[10px] text-text-light">পেমেন্ট</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-bold text-primary text-small">{formatCurrency(item.totalPaid || 0)}</p>
                  <p className="text-[10px] text-text-light">মোট পরিশোধ</p>
                </div>
              </div>

              {/* Next due */}
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-secondary">পরবর্তী তারিখ:</span>
                <span className={cn(
                  'font-semibold',
                  item.isOverdue ? 'text-red-500' : 'text-text-main'
                )}>
                  {item.isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                  {formatDate(item.nextDueDate)}
                </span>
              </div>

              {item.lastPaidDate && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-secondary">সর্বশেষ পরিশোধ:</span>
                  <span className="font-medium text-text-main">{formatDate(item.lastPaidDate)}</span>
                </div>
              )}

              {/* Payment history mini */}
              {item.paymentHistory?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary mb-2">সাম্প্রতিক পেমেন্ট</p>
                  <div className="space-y-1.5">
                    {item.paymentHistory.slice(-3).reverse().map((p, i) => (
                      <div key={i} className="flex justify-between text-[11px] bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-text-secondary">{formatDate(p.paidAt)}</span>
                        <span className="font-semibold text-primary">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function RecurringManagePage() {
  const dispatch    = useAppDispatch()
  const allList     = useAppSelector(selectAllRecurring)
  const overdue     = useAppSelector(selectOverdue)
  const loading     = useAppSelector(selectRecurringLoad)
  const pagination  = useAppSelector(selectRecurringPagination)

  const [tab,    setTab]    = useState('all')
  const [status, setStatus] = useState('')
  const [page,   setPage]   = useState(1)

  useEffect(() => {
    dispatch(fetchAllRecurring({ status: status || undefined, page }))
    dispatch(fetchOverdueRecurring())
  }, [dispatch, status, page])

  // summary stats
  const activeCount = allList.filter((r) => r.status === 'active').length
  const totalMonthly = allList
    .filter((r) => r.status === 'active' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0)

  const displayList = tab === 'overdue' ? overdue : allList

  const STATUS_TABS = [
    { value: '',          label: 'সবগুলো' },
    { value: 'active',    label: 'সক্রিয়' },
    { value: 'paused',    label: 'বিরতি' },
    { value: 'cancelled', label: 'বাতিল' },
  ]

  return (
    <div className="space-y-md pb-8">

      {/* Header */}
      <div>
        <h2 className="font-heading font-bold text-text-main text-h2">Recurring Donations</h2>
        <p className="text-small text-text-secondary mt-xs">নিয়মিত donation সদস্যতা</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 text-center">
          <p className="font-heading font-black text-primary text-[22px]">{allList.length}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">মোট সাবস্ক্রিপশন</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 text-center">
          <p className="font-heading font-black text-secondary text-[22px]">{activeCount}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">সক্রিয়</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 text-center">
          <p className="font-heading font-black text-donate text-[18px]">{overdue.length}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">মেয়াদোত্তীর্ণ</p>
        </div>
      </div>

      {/* Monthly income estimate */}
      {totalMonthly > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3">
          <TrendingUp size={18} className="text-primary" />
          <div>
            <p className="text-small font-semibold text-text-main">
              আনুমানিক মাসিক আয়: <span className="text-primary">{formatCurrency(totalMonthly)}</span>
            </p>
            <p className="text-[11px] text-text-secondary">শুধু মাসিক active subscriptions</p>
          </div>
        </div>
      )}

      {/* View tabs: All vs Overdue */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'সব তালিকা' },
          { value: 'overdue', label: `মেয়াদোত্তীর্ণ ${overdue.length > 0 ? `(${overdue.length})` : ''}` },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-small font-semibold transition-all',
              tab === t.value
                ? t.value === 'overdue' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                : 'bg-white text-text-secondary border border-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status filter (only for all tab) */}
      {tab === 'all' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatus(t.value); setPage(1) }}
              className={cn(
                'px-4 py-2 rounded-xl text-small font-semibold whitespace-nowrap transition-all flex-shrink-0',
                status === t.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary border border-gray-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Overdue section */}
      {tab === 'overdue' && (
        overdue.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={36} className="text-secondary mx-auto mb-2" />
            <p className="font-semibold text-text-secondary">সব payment আপ-টু-ডেট!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {overdue.map((item) => (
              <OverdueCard key={item._id} item={item} />
            ))}
          </div>
        )
      )}

      {/* All list */}
      {tab === 'all' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw size={36} className="text-text-light mx-auto mb-2" />
            <p className="font-semibold text-text-secondary">কোনো recurring donation নেই</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <AnimatePresence>
                {displayList.map((item) => (
                  <RecurringRow key={item._id} item={item} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-small font-medium text-text-secondary disabled:opacity-40"
                >
                  আগে
                </button>
                <span className="text-small text-text-secondary">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-small font-medium text-text-secondary disabled:opacity-40"
                >
                  পরে
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}