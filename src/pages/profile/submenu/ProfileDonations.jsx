import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, RefreshCw, ChevronRight, CheckCircle,
  Clock, XCircle, AlertTriangle, Plus, ArrowRight,
  PauseCircle, PlayCircle, Zap, Trash2, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchMyDonations, selectMyDonations, selectDonationLoad } from '@/app/store/donationSlice'
import {
  fetchMyRecurring, pauseRecurring, resumeRecurring,
  cancelRecurring, makeRecurringPayment,
  selectMyRecurring, selectRecurringLoad, selectRecurringAction,
} from '@/app/store/recurringDonationSlice'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

const DONATION_STATUS = {
  pending:   { icon: Clock,         color: 'text-donate',    bg: 'bg-donate/10',    label: 'অপেক্ষমাণ' },
  completed: { icon: CheckCircle,   color: 'text-secondary', bg: 'bg-secondary/10', label: 'সম্পন্ন'   },
  failed:    { icon: XCircle,       color: 'text-red-500',   bg: 'bg-red-50',       label: 'বাতিল'     },
  refunded:  { icon: AlertTriangle, color: 'text-purple-500',bg: 'bg-purple-50',    label: 'ফেরত'      },
}

const RECURRING_STATUS = {
  active:    { icon: CheckCircle, color: 'text-secondary', bg: 'bg-secondary/10', strip: 'bg-primary'   },
  paused:    { icon: PauseCircle, color: 'text-amber-500', bg: 'bg-amber-50',     strip: 'bg-amber-400' },
  cancelled: { icon: XCircle,     color: 'text-red-500',   bg: 'bg-red-50',       strip: 'bg-gray-300'  },
}

const FREQ_LABEL = { monthly: 'মাসিক', quarterly: 'ত্রৈমাসিক', yearly: 'বার্ষিক' }
const METHOD_CLR = {
  bkash: 'bg-pink-100 text-pink-700', nagad: 'bg-orange-100 text-orange-700',
  rocket: 'bg-purple-100 text-purple-700', bank: 'bg-blue-100 text-blue-700',
  cash: 'bg-gray-100 text-gray-700',
}

const daysUntil = (date) =>
  Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))

// ── PAY SHEET ─────────────────────────────────────────────────────────────────
function PaySheet({ item, onClose, onPaid }) {
  const dispatch = useAppDispatch()
  const loading  = useAppSelector(selectRecurringAction)
  const [method, setMethod] = useState(item.paymentMethod || 'bkash')
  const [ref, setRef]       = useState('')

  const METHODS = [
    { v: 'bkash',  l: 'bKash',  e: '💜' },
    { v: 'nagad',  l: 'Nagad',  e: '🟠' },
    { v: 'rocket', l: 'Rocket', e: '🟣' },
    { v: 'bank',   l: 'Bank',   e: '🏦' },
    { v: 'cash',   l: 'Cash',   e: '💵' },
  ]

  const handlePay = async () => {
    if (!ref.trim()) { toast.error('Transaction ID দিন'); return }
    const res = await dispatch(makeRecurringPayment({ id: item._id, data: { paymentMethod: method, paymentReference: ref } }))
    if (makeRecurringPayment.fulfilled.match(res)) {
      toast.success('Payment submit হয়েছে! ✓')
      onPaid(); onClose()
    } else {
      toast.error(res.payload || 'সমস্যা হয়েছে')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-white rounded-t-[2rem] px-5 pb-8 pt-3"
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-bold text-text-main">Payment করুন</h3>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {formatCurrency(item.amount)} · {FREQ_LABEL[item.frequency]}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={16} className="text-text-secondary" />
          </button>
        </div>

        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Payment Method</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {METHODS.map((m) => (
            <button key={m.v} onClick={() => setMethod(m.v)}
              className={cn('flex flex-col items-center py-2.5 rounded-xl border-2 transition-all',
                method === m.v ? 'border-primary bg-primary/5' : 'border-gray-100')}
            >
              <span className="text-[16px]">{m.e}</span>
              <span className={cn('text-[9px] font-bold mt-0.5', method === m.v ? 'text-primary' : 'text-text-light')}>
                {m.l}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Transaction ID <span className="text-red-400">*</span>
        </p>
        <input
          value={ref} onChange={(e) => setRef(e.target.value)}
          placeholder="TXN1234567890"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-small font-mono text-text-main focus:outline-none focus:border-primary mb-5"
        />

        <button onClick={handlePay} disabled={loading}
          className="w-full py-4 bg-primary text-white rounded-xl font-black text-small flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? 'Submit হচ্ছে...' : `${formatCurrency(item.amount)} Pay করুন`}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── CANCEL SHEET ──────────────────────────────────────────────────────────────
function CancelSheet({ item, onClose, onCancelled }) {
  const dispatch = useAppDispatch()
  const loading  = useAppSelector(selectRecurringAction)

  const handleCancel = async () => {
    const res = await dispatch(cancelRecurring(item._id))
    if (cancelRecurring.fulfilled.match(res)) {
      toast.success('Subscription বাতিল করা হয়েছে')
      onCancelled(); onClose()
    } else {
      toast.error(res.payload || 'সমস্যা হয়েছে')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-white rounded-t-[2rem] px-5 pb-8 pt-3"
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-heading font-bold text-text-main text-center text-[18px]">Subscription বাতিল করবেন?</h3>
        <p className="text-small text-text-secondary text-center mt-2 mb-6">
          {item.campaign?.title || 'General Donation'} এর{' '}
          <span className="font-bold text-primary">{formatCurrency(item.amount)}</span>{' '}
          {FREQ_LABEL[item.frequency]} subscription বাতিল হয়ে যাবে।
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-3.5 rounded-xl border-2 border-gray-200 text-small font-bold text-text-secondary">
            না, রাখুন
          </button>
          <button onClick={handleCancel} disabled={loading}
            className="py-3.5 rounded-xl bg-red-500 text-white text-small font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <RefreshCw size={14} className="animate-spin" />}
            হ্যাঁ, বাতিল
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── DONATION ITEM ─────────────────────────────────────────────────────────────
function DonationItem({ d, delay }) {
  const status     = DONATION_STATUS[d.status] || DONATION_STATUS.pending
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-card"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', status.bg)}>
        <StatusIcon size={18} className={status.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-small font-semibold text-text-main truncate">
          {d.campaign?.title || 'General Donation'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', METHOD_CLR[d.paymentMethod] || 'bg-gray-100 text-gray-700')}>
            {d.paymentMethod}
          </span>
          <span className="text-[11px] text-text-light">{formatDate(d.createdAt)}</span>
        </div>
        {d.transactionId && <p className="text-[10px] text-text-light mt-0.5 font-mono truncate">{d.transactionId}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-heading font-black text-primary">{formatCurrency(d.amount)}</p>
        <span className={cn('text-[10px] font-bold', status.color)}>{status.label}</span>
      </div>
    </motion.div>
  )
}

// ── RECURRING CARD ────────────────────────────────────────────────────────────
function RecurringCard({ item, delay, onRefresh }) {
  const dispatch   = useAppDispatch()
  const actionLoad = useAppSelector(selectRecurringAction)

  const [payOpen,    setPayOpen]    = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const status     = RECURRING_STATUS[item.status] || RECURRING_STATUS.active
  const StatusIcon = status.icon
  const due        = daysUntil(item.nextDueDate)
  const isOverdue  = item.status === 'active' && due < 0

  const handlePause = async () => {
    const res = await dispatch(pauseRecurring(item._id))
    if (pauseRecurring.fulfilled.match(res)) toast.success('বিরতি দেওয়া হয়েছে')
    else toast.error(res.payload || 'সমস্যা হয়েছে')
  }

  const handleResume = async () => {
    const res = await dispatch(resumeRecurring(item._id))
    if (resumeRecurring.fulfilled.match(res)) toast.success('পুনরায় শুরু হয়েছে')
    else toast.error(res.payload || 'সমস্যা হয়েছে')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        className={cn(
          'bg-white rounded-2xl border shadow-card overflow-hidden',
          isOverdue ? 'border-red-200' : 'border-gray-100'
        )}
      >
        {/* Color strip */}
        <div className={cn('h-1 w-full', status.strip)} />

        {/* Info row */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', status.bg)}>
            <StatusIcon size={18} className={status.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-small font-semibold text-text-main truncate">
              {item.campaign?.title || 'General Donation'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/8 text-primary">
                {FREQ_LABEL[item.frequency]}
              </span>
              {item.status === 'active' && (
                <span className={cn('text-[10px] font-medium', isOverdue ? 'text-red-500 font-bold' : 'text-text-light')}>
                  {isOverdue ? `⚠ ${Math.abs(due)} দিন পেরিয়েছে` : due === 0 ? 'আজ due' : `${due} দিন পরে`}
                </span>
              )}
              {item.status === 'paused' && <span className="text-[10px] text-amber-500">বিরতিতে আছে</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-heading font-black text-primary">{formatCurrency(item.amount)}</p>
            <p className="text-[10px] text-text-light">{item.paymentCount || 0} payments</p>
          </div>
        </div>

        {/* Action buttons */}
        {item.status !== 'cancelled' && (
          <div className="flex border-t border-gray-50 divide-x divide-gray-50">
            {/* Pay (active) */}
            {item.status === 'active' && (
              <button onClick={() => setPayOpen(true)} disabled={actionLoad}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold transition-colors',
                  isOverdue ? 'text-white bg-primary hover:bg-primary/90' : 'text-primary hover:bg-primary/5'
                )}>
                <Zap size={13} />
                {isOverdue ? 'এখনই Pay করুন' : 'Pay করুন'}
              </button>
            )}

            {/* Resume (paused) */}
            {item.status === 'paused' && (
              <button onClick={handleResume} disabled={actionLoad}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold text-secondary hover:bg-secondary/5 transition-colors">
                {actionLoad ? <RefreshCw size={12} className="animate-spin" /> : <PlayCircle size={13} />}
                পুনরায় শুরু
              </button>
            )}

            {/* Pause (active) */}
            {item.status === 'active' && (
              <button onClick={handlePause} disabled={actionLoad}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-amber-500 hover:bg-amber-50 transition-colors">
                {actionLoad ? <RefreshCw size={12} className="animate-spin" /> : <PauseCircle size={13} />}
                বিরতি
              </button>
            )}

            {/* Cancel */}
            <button onClick={() => setCancelOpen(true)} disabled={actionLoad}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 size={12} />
              বাতিল
            </button>
          </div>
        )}

        {item.status === 'cancelled' && (
          <div className="px-4 py-2 border-t border-gray-50 text-center">
            <p className="text-[11px] text-text-light">
              {item.cancelledAt ? formatDate(item.cancelledAt) + ' এ বাতিল' : 'বাতিল করা হয়েছে'}
            </p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {payOpen    && <PaySheet    item={item} onClose={() => setPayOpen(false)}    onPaid={onRefresh} />}
        {cancelOpen && <CancelSheet item={item} onClose={() => setCancelOpen(false)} onCancelled={onRefresh} />}
      </AnimatePresence>
    </>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ProfileDonations() {
  const dispatch  = useAppDispatch()
  const donations = useAppSelector(selectMyDonations)
  const recurring = useAppSelector(selectMyRecurring)
  const dLoad     = useAppSelector(selectDonationLoad)
  const rLoad     = useAppSelector(selectRecurringLoad)
  const [tab, setTab] = useState('oneTime')

  const loadData = useCallback(() => {
    dispatch(fetchMyDonations())
    dispatch(fetchMyRecurring({}))
  }, [dispatch])

  useEffect(() => { loadData() }, [loadData])

  const totalGiven      = donations.filter((d) => d.status === 'completed').reduce((s, d) => s + d.amount, 0)
  const activeRecurring = recurring.filter((r) => r.status === 'active').length
  const overdueCount    = recurring.filter((r) => r.status === 'active' && daysUntil(r.nextDueDate) < 0).length

  return (
    <div className="space-y-md pb-6">

      {/* Summary */}
      {(totalGiven > 0 || recurring.length > 0) && (
        <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-2xl p-5 border border-primary/10">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'মোট দেওয়া',        value: formatCurrency(totalGiven), color: 'text-primary'   },
              { label: 'donation',          value: donations.length,          color: 'text-text-main' },
              { label: 'সক্রিয় recurring',  value: activeRecurring,           color: 'text-secondary' },
            ].map((s, i) => (
              <div key={i} className={cn('text-center', i === 1 ? 'border-x border-primary/10' : '')}>
                <p className={cn('font-heading font-black text-[20px] leading-none', s.color)}>{s.value}</p>
                <p className="text-[10px] text-text-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {overdueCount > 0 && (
            <button onClick={() => setTab('recurring')}
              className="flex items-center justify-center gap-2 w-full mt-3 pt-3 border-t border-primary/10 text-[12px] text-red-500 font-semibold">
              <AlertTriangle size={12} />
              {overdueCount}টি payment মেয়াদ পেরিয়েছে — এখনই Pay করুন
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-50 rounded-xl p-1">
        {[
          { value: 'oneTime',   label: 'এককালীন', count: donations.length },
          { value: 'recurring', label: 'নিয়মিত',  count: recurring.length },
        ].map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-small font-semibold transition-all',
              tab === t.value ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'
            )}>
            {t.label}
            {t.count > 0 && (
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                tab === t.value ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {(dLoad || rLoad) ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : tab === 'oneTime' ? (
        donations.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={36} className="text-text-light mx-auto mb-3" />
            <p className="font-semibold text-text-secondary">এখনো কোনো donation করেননি</p>
            <Link to="/app/donate" className="inline-flex items-center gap-1.5 mt-3 text-primary text-small font-medium">
              Campaign দেখুন <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {donations.map((d, i) => <DonationItem key={d._id} d={d} delay={i * 0.04} />)}
          </div>
        )
      ) : (
        recurring.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw size={36} className="text-text-light mx-auto mb-3" />
            <p className="font-semibold text-text-secondary">কোনো নিয়মিত donation নেই</p>
            <Link to="/app/donate" className="inline-flex items-center gap-1.5 mt-3 text-primary text-small font-medium">
              Campaign দেখুন <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recurring.map((item, i) => (
              <RecurringCard key={item._id} item={item} delay={i * 0.05} onRefresh={loadData} />
            ))}
          </div>
        )
      )}

      {/* CTA */}
      <Link to="/app/donate"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-dashed border-primary/30 text-primary text-small font-semibold hover:border-primary/60 hover:bg-primary/3 transition-all">
        <Plus size={16} />
        নতুন donation করুন
      </Link>
    </div>
  )
}