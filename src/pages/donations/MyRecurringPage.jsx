import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  RefreshCw, PauseCircle, PlayCircle, XCircle,
  Plus, Calendar, CreditCard, ChevronDown,
  AlertTriangle, CheckCircle, Clock, Banknote,
  X, ArrowRight, Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchMyRecurring, pauseRecurring, resumeRecurring,
  cancelRecurring, makeRecurringPayment,
  selectMyRecurring, selectRecurringLoad, selectRecurringAction,
} from '@/app/store/recurringDonationSlice'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ─── Constants ────────────────────────────────────────────────────────────────
const FREQ_CONFIG = {
  monthly:   { label: 'মাসিক',      cycle: '১ মাস',    color: '#0F766E', bg: 'bg-teal-50',    text: 'text-teal-700'  },
  quarterly: { label: 'ত্রৈমাসিক', cycle: '৩ মাস',    color: '#8B5CF6', bg: 'bg-violet-50',  text: 'text-violet-700' },
  yearly:    { label: 'বার্ষিক',    cycle: '১ বছর',   color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-700' },
}

const STATUS_CONFIG = {
  active:    { label: 'সক্রিয়', icon: CheckCircle, ring: 'ring-emerald-400', dot: 'bg-emerald-400' },
  paused:    { label: 'বিরতি',   icon: PauseCircle, ring: 'ring-amber-400',  dot: 'bg-amber-400'  },
  cancelled: { label: 'বাতিল',  icon: XCircle,     ring: 'ring-red-400',    dot: 'bg-red-400'    },
}

const PAYMENT_METHODS = [
  { value: 'bkash',  label: 'bKash'  },
  { value: 'nagad',  label: 'Nagad'  },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank',   label: 'Bank'   },
  { value: 'cash',   label: 'Cash'   },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysUntil = (date) => {
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAY NOW BOTTOM SHEET
// ═══════════════════════════════════════════════════════════════════════════════
function PaySheet({ recurring, onClose, onPay, loading }) {
  const [method, setMethod]    = useState(recurring.paymentMethod || 'bkash')
  const [reference, setRef]    = useState('')

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

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-text-main text-[18px]">Payment করুন</p>
              <p className="text-small text-text-secondary mt-0.5">
                {recurring.campaign?.title || 'General Donation'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading font-black text-primary text-[24px]">
                {formatCurrency(recurring.amount)}
              </p>
              <p className="text-[11px] text-text-light">
                {FREQ_CONFIG[recurring.frequency]?.label}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Payment method */}
          <div>
            <p className="text-[12px] font-semibold text-text-secondary mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    'py-2.5 rounded-xl text-small font-semibold border-2 transition-all',
                    method === m.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 bg-gray-50 text-text-secondary hover:border-gray-200'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div>
            <p className="text-[12px] font-semibold text-text-secondary mb-2">
              Transaction Reference <span className="text-text-light font-normal">(optional)</span>
            </p>
            <input
              value={reference}
              onChange={(e) => setRef(e.target.value)}
              placeholder="TXN ID বা reference নম্বর..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-small text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => onPay({ paymentMethod: method, paymentReference: reference })}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold text-small flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
          >
            {loading
              ? <RefreshCw size={17} className="animate-spin" />
              : <Zap size={17} />
            }
            {loading ? 'Submit হচ্ছে...' : `${formatCurrency(recurring.amount)} Payment করুন`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANCEL CONFIRM SHEET
// ═══════════════════════════════════════════════════════════════════════════════
function CancelSheet({ recurring, onClose, onConfirm, loading }) {
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
        className="w-full max-w-lg mx-auto bg-white rounded-t-[2rem] p-6"
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h3 className="font-heading font-bold text-text-main text-[18px]">সাবস্ক্রিপশন বাতিল?</h3>
          <p className="text-small text-text-secondary mt-2 leading-relaxed">
            <span className="font-semibold text-text-main">{formatCurrency(recurring.amount)}</span>
            {' '}{FREQ_CONFIG[recurring.frequency]?.label} donation বাতিল করলে পরবর্তীতে নতুন সাবস্ক্রিপশন করতে হবে।
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-small font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
          >
            থাকুক
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-red-500 text-white text-small font-bold hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {loading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : 'হ্যাঁ, বাতিল করুন'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING SUBSCRIPTION CARD
// ═══════════════════════════════════════════════════════════════════════════════
function RecurringCard({ item, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const freq   = FREQ_CONFIG[item.frequency] || FREQ_CONFIG.monthly
  const status = STATUS_CONFIG[item.status]  || STATUS_CONFIG.active
  const StatusIcon = status.icon

  const due      = daysUntil(item.nextDueDate)
  const isOverdue = due < 0
  const isDueSoon = due >= 0 && due <= 3

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-2xl border shadow-card overflow-hidden transition-all',
        isOverdue ? 'border-red-200' : 'border-gray-100'
      )}
    >
      {/* Colored top strip */}
      <div
        className="h-1.5 w-full"
        style={{ background: item.status === 'cancelled' ? '#E5E7EB' : freq.color }}
      />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Status dot */}
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', status.dot)} />
              <p className="font-heading font-semibold text-text-main truncate">
                {item.campaign?.title || 'General Donation'}
              </p>
            </div>
            <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full inline-block', freq.bg, freq.text)}>
              {freq.label} · {freq.cycle} পর পর
            </span>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-heading font-black text-primary text-[22px] leading-none">
              {formatCurrency(item.amount)}
            </p>
            <p className="text-[11px] text-text-light mt-0.5">{status.label}</p>
          </div>
        </div>

        {/* Due date chip */}
        {item.status === 'active' && (
          <div className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 mb-3 text-[12px] font-medium',
            isOverdue  ? 'bg-red-50 text-red-600' :
            isDueSoon  ? 'bg-amber-50 text-amber-700' :
                         'bg-gray-50 text-text-secondary'
          )}>
            {isOverdue
              ? <AlertTriangle size={13} />
              : isDueSoon ? <Clock size={13} />
              : <Calendar size={13} />
            }
            {isOverdue
              ? `${Math.abs(due)} দিন পেরিয়ে গেছে!`
              : due === 0 ? 'আজ payment দিন!'
              : `${due} দিন পরে`
            }
            <span className="ml-auto text-[11px] opacity-70">{formatDate(item.nextDueDate)}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'মোট payment', value: item.paymentCount || 0 },
            { label: 'মোট দেওয়া', value: formatCurrency(item.totalPaid || 0) },
            { label: 'শুরু', value: formatDate(item.startDate) },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="font-bold text-text-main text-small leading-tight">{s.value}</p>
              <p className="text-[10px] text-text-light mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {item.status !== 'cancelled' && (
          <div className="flex gap-2">
            {item.status === 'active' && (
              <>
                <button
                  onClick={() => onAction('pay', item)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-small font-bold hover:bg-primary-dark transition-colors shadow-sm active:scale-[0.97]"
                >
                  <Zap size={14} />
                  Pay Now
                </button>
                <button
                  onClick={() => onAction('pause', item)}
                  className="px-3 py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <PauseCircle size={17} />
                </button>
              </>
            )}
            {item.status === 'paused' && (
              <button
                onClick={() => onAction('resume', item)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary text-white text-small font-bold hover:bg-secondary-light transition-colors shadow-sm"
              >
                <PlayCircle size={16} />
                Resume করুন
              </button>
            )}
            <button
              onClick={() => onAction('cancel', item)}
              className={cn(
                'px-3 py-2.5 rounded-xl transition-colors',
                item.status === 'paused' ? 'flex-none bg-red-50 text-red-500 hover:bg-red-100' : 'bg-red-50 text-red-500 hover:bg-red-100'
              )}
            >
              <XCircle size={17} />
            </button>
          </div>
        )}

        {/* Expand payment history */}
        {item.paymentHistory?.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 mt-2 py-1.5 text-[12px] text-text-light hover:text-primary transition-colors"
          >
            <span>Payment ইতিহাস</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown size={13} />
            </motion.div>
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                {item.paymentHistory.slice().reverse().map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] px-1">
                    <span className="text-text-secondary">{formatDate(p.paidAt)}</span>
                    <span className="font-semibold text-primary">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MyRecurringPage() {
  const dispatch    = useAppDispatch()
  const list        = useAppSelector(selectMyRecurring)
  const loading     = useAppSelector(selectRecurringLoad)
  const actionLoad  = useAppSelector(selectRecurringAction)

  const [filter,       setFilter]       = useState('active')
  const [payTarget,    setPayTarget]    = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchMyRecurring({ status: filter || undefined }))
  }, [dispatch, filter])

  // ── Action dispatcher ──────────────────────────────────────────────────────
  const handleAction = useCallback((type, item) => {
    if (type === 'pay')    { setPayTarget(item);    return }
    if (type === 'cancel') { setCancelTarget(item); return }

    const thunk = type === 'pause'  ? pauseRecurring
                : type === 'resume' ? resumeRecurring
                : null
    if (!thunk) return

    dispatch(thunk(item._id)).then((res) => {
      if (thunk.fulfilled.match(res)) {
        toast.success(type === 'pause' ? 'বিরতি দেওয়া হয়েছে' : 'পুনরায় শুরু হয়েছে')
      } else {
        toast.error('কাজ করা যায়নি')
      }
    })
  }, [dispatch])

  const handlePay = useCallback(async (data) => {
    if (!payTarget) return
    const res = await dispatch(makeRecurringPayment({ id: payTarget._id, data }))
    if (makeRecurringPayment.fulfilled.match(res)) {
      toast.success('Payment submit হয়েছে! অনুমোদনের অপেক্ষায় আছে।')
      setPayTarget(null)
    } else {
      toast.error('Payment করা যায়নি')
    }
  }, [dispatch, payTarget])

  const handleCancel = useCallback(async () => {
    if (!cancelTarget) return
    const res = await dispatch(cancelRecurring(cancelTarget._id))
    if (cancelRecurring.fulfilled.match(res)) {
      toast.success('সাবস্ক্রিপশন বাতিল হয়েছে')
      setCancelTarget(null)
    } else {
      toast.error('বাতিল করা যায়নি')
    }
  }, [dispatch, cancelTarget])

  const FILTER_TABS = [
    { value: 'active',    label: 'সক্রিয়' },
    { value: 'paused',    label: 'বিরতি' },
    { value: 'cancelled', label: 'বাতিল' },
    { value: '',          label: 'সবগুলো' },
  ]

  // Summary
  const totalMonthly = list
    .filter((r) => r.status === 'active' && r.frequency === 'monthly')
    .reduce((s, r) => s + r.amount, 0)
  const overdueCount = list.filter((r) => r.status === 'active' && daysUntil(r.nextDueDate) < 0).length

  return (
    <div className="space-y-md pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-text-main text-h2">নিয়মিত Donation</h2>
          <p className="text-small text-text-secondary mt-xs">আমার সাবস্ক্রিপশন</p>
        </div>
        <Link
          to="/app/donate"
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-small font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} />
          নতুন
        </Link>
      </div>

      {/* Summary strip */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {totalMonthly > 0 && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/15">
              <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-1">মাসিক প্রতিশ্রুতি</p>
              <p className="font-heading font-black text-primary text-[22px]">{formatCurrency(totalMonthly)}</p>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <p className="text-[11px] text-red-600 font-semibold uppercase tracking-wide mb-1">মেয়াদোত্তীর্ণ</p>
              <p className="font-heading font-black text-red-500 text-[22px]">{overdueCount}টি</p>
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-small font-semibold whitespace-nowrap transition-all flex-shrink-0',
              filter === t.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-secondary border border-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={28} className="text-primary/40" />
          </div>
          <p className="font-semibold text-text-secondary">কোনো সাবস্ক্রিপশন নেই</p>
          <Link to="/app/donate" className="inline-flex items-center gap-1.5 mt-3 text-primary text-small font-medium">
            Campaign দেখুন <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {list.map((item) => (
              <RecurringCard key={item._id} item={item} onAction={handleAction} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom sheets */}
      <AnimatePresence>
        {payTarget && (
          <PaySheet
            recurring={payTarget}
            onClose={() => setPayTarget(null)}
            onPay={handlePay}
            loading={actionLoad}
          />
        )}
        {cancelTarget && (
          <CancelSheet
            recurring={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onConfirm={handleCancel}
            loading={actionLoad}
          />
        )}
      </AnimatePresence>
    </div>
  )
}