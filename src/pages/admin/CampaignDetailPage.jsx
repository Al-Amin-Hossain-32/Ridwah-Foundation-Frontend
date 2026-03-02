import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Heart, Users, Calendar, Share2,
  CheckCircle, Clock, Zap, RefreshCw,
  ChevronRight, Target, Flame, Trophy,
  Eye, EyeOff,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchCampaignById,
  selectSelectedCampaign,
  selectCampaignLoad,
} from '@/app/store/campaignSlice'
import { formatCurrency, formatDate, timeAgo } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const safeNum = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0)

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:    { label: 'চলমান',         color: 'bg-secondary/10 text-secondary', dot: 'bg-secondary' },
  completed: { label: 'লক্ষ্য পূরণ',  color: 'bg-blue-50 text-blue-700',       dot: 'bg-blue-500'  },
  expired:   { label: 'মেয়াদ শেষ',    color: 'bg-red-50 text-red-600',         dot: 'bg-red-400'   },
  draft:     { label: 'Draft',          color: 'bg-gray-50 text-gray-500',       dot: 'bg-gray-400'  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════════════════════
function AnimatedCounter({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const end   = safeNum(value)
    const step  = (end - start) / (duration / 16)
    let cur     = start
    const timer = setInterval(() => {
      cur += step
      if ((step > 0 && cur >= end) || (step < 0 && cur <= end)) {
        setDisplay(end)
        prev.current = end
        clearInterval(timer)
      } else {
        setDisplay(Math.round(cur))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])

  return <>{display.toLocaleString('bn-BD')}</>
}

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME DONOR FEED ITEM
// ═══════════════════════════════════════════════════════════════════════════════
function DonorFeedItem({ donor, amount, time, isAnonymous, isNew }) {
  const initials = isAnonymous
    ? '?'
    : (donor?.name || 'D').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all',
        isNew ? 'bg-secondary/5 border-secondary/25 shadow-sm' : 'bg-white border-gray-100'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {!isAnonymous && donor?.profilePicture ? (
          <img src={donor.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-small">
            {isAnonymous ? '?' : initials}
          </div>
        )}
        {isNew && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-small font-semibold text-text-main">
          {isAnonymous ? 'Anonymous' : (donor?.name || 'Donor')}
        </p>
        <p className="text-[11px] text-text-light">{timeAgo(time)}</p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="font-heading font-black text-primary">{formatCurrency(amount)}</p>
        {isNew && <p className="text-[10px] text-secondary font-semibold">নতুন ✓</p>}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS RING (large, animated)
// ═══════════════════════════════════════════════════════════════════════════════
function ProgressRing({ pct, size = 120, strokeWidth = 10 }) {
  const r      = (size - strokeWidth) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (circ * Math.min(pct, 100)) / 100

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#0F766E" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════
function PageSkeleton() {
  return (
    <div className="space-y-4 pb-8 animate-pulse">
      <div className="h-52 bg-gray-100 rounded-2xl" />
      <div className="h-32 bg-white rounded-2xl border border-gray-100" />
      <div className="h-48 bg-white rounded-2xl border border-gray-100" />
      <div className="h-64 bg-white rounded-2xl border border-gray-100" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CampaignDetailPage() {
  const { id }     = useParams()
  const dispatch   = useAppDispatch()
  const campaign   = useAppSelector(selectSelectedCampaign)
  const loading    = useAppSelector(selectCampaignLoad)

  // Local donor feed — seeded from campaign, updated via socket
  const [donorFeed, setDonorFeed]   = useState([])
  const [newDonorId, setNewDonorId] = useState(null)
  const [showAll,    setShowAll]    = useState(false)
  const [liveCount,  setLiveCount]  = useState(0)

  // Fetch campaign
  useEffect(() => {
    if (id) dispatch(fetchCampaignById(id))
  }, [dispatch, id])

  // Seed donor feed from campaign.recentDonors or recentDonations
  useEffect(() => {
    const donors = campaign?.recentDonors || campaign?.recentDonations || []
    if (donors.length) {
      setDonorFeed(donors.slice(0, 15))
    }
  }, [campaign?._id])

  // Socket: listen for new donations on this campaign
  useEffect(() => {
    // useSocket hook ইতিমধ্যে global — এখানে custom event listener যোগ
    const handler = (data) => {
      if (data.campaignId !== id) return
      const newEntry = {
        _id:         data._id || Date.now(),
        donor:       data.donor,
        amount:      data.amount,
        isAnonymous: data.isAnonymous,
        createdAt:   new Date().toISOString(),
        _isNew:      true,
      }
      setDonorFeed((prev) => [newEntry, ...prev].slice(0, 30))
      setNewDonorId(newEntry._id)
      setLiveCount((c) => c + 1)

      // Clear "new" highlight after 5s
      setTimeout(() => setNewDonorId(null), 5000)
    }

    window.__socket?.on('newDonation', handler)
    window.__socket?.on('donationStatusUpdated', (data) => {
      if (data.campaignId === id && data.status === 'completed') {
        handler(data)
      }
    })
    return () => {
      window.__socket?.off('newDonation', handler)
    }
  }, [id])

  if (loading || !campaign) return <PageSkeleton />

  const currentAmount = safeNum(campaign.currentAmount)
  const goalAmount    = safeNum(campaign.goalAmount)
  const pct           = goalAmount > 0 ? Math.min(Math.round((currentAmount / goalAmount) * 100), 100) : 0
  const daysLeft      = safeNum(campaign.daysRemaining)
  const donorCount    = safeNum(campaign.donorCount)
  const status        = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.active

  const visibleDonors = showAll ? donorFeed : donorFeed.slice(0, 5)

  return (
    <div className="space-y-md pb-28">

      {/* ── Back ── */}
      <Link to="/app/donate" className="inline-flex items-center gap-1.5 text-primary text-small font-medium">
        <ArrowLeft size={16} />
        সব Campaign
      </Link>

      {/* ── Cover image ── */}
      {campaign.coverImage?.url ? (
        <div className="h-52 rounded-2xl overflow-hidden -mx-0">
          <img
            src={campaign.coverImage.url}
            alt={campaign.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      ) : (
        <div className="h-52 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
          <Target size={48} className="text-primary/30" />
        </div>
      )}

      {/* ── Title + Status ── */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading font-black text-text-main text-[22px] leading-snug flex-1">
            {campaign.title}
          </h1>
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0', status.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
            {status.label}
          </div>
        </div>

        {/* Live badge */}
        {liveCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 mt-2 bg-red-50 text-red-500 text-[11px] font-semibold px-3 py-1 rounded-full border border-red-200"
          >
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {liveCount} নতুন donation এইমাত্র!
          </motion.div>
        )}
      </div>

      {/* ── Progress card ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <ProgressRing pct={pct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading font-black text-primary text-[16px]">{pct}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wide mb-0.5">সংগ্রহ</p>
              <p className="font-heading font-black text-primary text-[22px] leading-none">
                ৳<AnimatedCounter value={currentAmount} />
              </p>
              <p className="text-[11px] text-text-light mt-0.5">লক্ষ্য {formatCurrency(goalAmount)}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-[11px] text-text-light">দাতা</p>
                <p className="font-bold text-text-main"><AnimatedCounter value={donorCount} /></p>
              </div>
              <div>
                <p className="text-[11px] text-text-light">
                  {daysLeft > 0 ? 'দিন বাকি' : 'শেষ হয়েছে'}
                </p>
                <p className={cn('font-bold', daysLeft > 0 ? 'text-text-main' : 'text-red-500')}>
                  {daysLeft > 0 ? daysLeft : '০'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          />
        </div>

        {/* Milestone chips */}
        {pct >= 25 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {[25, 50, 75, 100].filter((m) => pct >= m).map((m) => (
              <span key={m} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-secondary/10 text-secondary rounded-full">
                <Trophy size={9} />
                {m}% পূরণ
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Meta info ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: Calendar, label: 'শুরু',    value: formatDate(campaign.startDate) },
          { icon: Calendar, label: 'শেষ',     value: formatDate(campaign.endDate) },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-card flex items-center gap-2.5">
            <m.icon size={16} className="text-primary/60 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-text-light uppercase tracking-wide">{m.label}</p>
              <p className="text-small font-semibold text-text-main">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Description ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
        <h3 className="font-heading font-semibold text-text-main mb-3">বিবরণ</h3>
        <p className="text-small text-text-secondary leading-relaxed whitespace-pre-line">
          {campaign.description}
        </p>
      </div>

      {/* ── Recent Donors live feed ── */}
      {donorFeed.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-text-main">সাম্প্রতিক Donors</h3>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100">
                  <Flame size={8} />
                  Live
                </span>
              )}
            </div>
            <span className="text-[11px] text-text-light">{donorFeed.length} জন</span>
          </div>

          <div className="px-4 py-3 space-y-2.5">
            <AnimatePresence>
              {visibleDonors.map((d) => (
                <DonorFeedItem
                  key={d._id}
                  donor={d.donor}
                  amount={d.amount}
                  time={d.createdAt}
                  isAnonymous={d.isAnonymous}
                  isNew={d._id === newDonorId || d._isNew}
                />
              ))}
            </AnimatePresence>
          </div>

          {donorFeed.length > 5 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-3.5 border-t border-gray-50 text-small text-primary font-semibold hover:bg-primary/3 transition-colors"
            >
              {showAll ? (
                <><EyeOff size={14} /> কম দেখুন</>
              ) : (
                <><Eye size={14} /> সব দেখুন ({donorFeed.length} জন)</>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Empty donors ── */}
      {donorFeed.length === 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card text-center">
          <Heart size={28} className="text-primary/20 mx-auto mb-2" />
          <p className="text-small text-text-secondary font-medium">প্রথম donor হোন!</p>
          <p className="text-[12px] text-text-light mt-1">এখনো কেউ donate করেনি।</p>
        </div>
      )}

      {/* ── Sticky Donate CTA ── */}
      {campaign.status === 'active' && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 max-w-lg mx-auto z-40">
          <Link
            to={`/app/donate/${id}/pay`}
            className="flex items-center justify-center gap-2.5 w-full py-4 bg-donate text-white rounded-2xl font-black text-[16px] shadow-donate hover:shadow-donate-hover active:scale-[0.98] transition-all"
          >
            <Zap size={20} fill="white" />
            Donate করুন
          </Link>
        </div>
      )}

    </div>
  )
}