import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Crown, Flame, Star } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchLeaderboard, selectLeaderboard } from '@/app/store/donationSlice'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ─── Rank config ───────────────────────────────────────────────────────────────
const RANK_CONFIG = {
  1: {
    icon:     Crown,
    bg:       'bg-gradient-to-br from-amber-50 to-yellow-50',
    border:   'border-amber-300',
    ring:     'ring-4 ring-amber-300/60',
    text:     'text-amber-600',
    badge:    'bg-amber-400 text-white',
    size:     'w-20 h-20',
    fontSize: 'text-[14px]',
    amtSize:  'text-[16px]',
  },
  2: {
    icon:     Medal,
    bg:       'bg-gradient-to-br from-slate-50 to-gray-50',
    border:   'border-slate-300',
    ring:     'ring-4 ring-slate-300/60',
    text:     'text-slate-600',
    badge:    'bg-slate-400 text-white',
    size:     'w-16 h-16',
    fontSize: 'text-[12px]',
    amtSize:  'text-[13px]',
  },
  3: {
    icon:     Medal,
    bg:       'bg-gradient-to-br from-orange-50 to-amber-50/50',
    border:   'border-amber-600/40',
    ring:     'ring-4 ring-amber-600/30',
    text:     'text-amber-700',
    badge:    'bg-amber-700 text-white',
    size:     'w-14 h-14',
    fontSize: 'text-[12px]',
    amtSize:  'text-[13px]',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function AvatarFallback({ name, className }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-primary to-secondary',
      'flex items-center justify-center text-white font-bold w-full h-full',
      className
    )}>
      {initials}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PODIUM CARD (top 3)
// ═══════════════════════════════════════════════════════════════════════════════
function PodiumCard({ entry, rank }) {
  const cfg = RANK_CONFIG[rank]
  if (!cfg || !entry) return null
  const RankIcon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, type: 'spring', stiffness: 200 }}
      className={cn(
        'flex-1 flex flex-col items-center gap-2 px-2 pt-4 pb-5 rounded-2xl border',
        cfg.bg, cfg.border
      )}
    >
      {/* Rank badge */}
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black', cfg.badge)}>
        <RankIcon size={13} />
      </div>

      {/* Avatar */}
      <div className={cn('relative rounded-full overflow-hidden', cfg.size, cfg.ring)}>
        {entry.donor?.profilePicture
          ? <img src={entry.donor?.profilePicture} alt={entry.donor.name} className="w-full h-full object-cover" />
          : <AvatarFallback name={entry.donor?.name} />
        }
      </div>

      {/* Name */}
      <p className={cn('font-heading font-bold text-text-main text-center leading-tight px-1', cfg.fontSize)}>
        {entry.donor?.name || 'Donor'}
      </p>

      {/* Amount */}
      <p className={cn('font-black font-heading', cfg.text, cfg.amtSize)}>
        {formatCurrency(entry.totalAmount)}
      </p>

      {/* Count */}
      <p className="text-[10px] text-text-light">{entry.donationCount}টি</p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST ROW (rank 4+)
// ═══════════════════════════════════════════════════════════════════════════════
function LeaderRow({ entry, rank, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow"
    >
      {/* Rank */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center font-black text-small flex-shrink-0',
        rank <= 10 ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-text-light'
      )}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        {entry.donor?.profilePicture
          ? <img src={entry.donor.profilePicture} alt="" className="w-full h-full object-cover" />
          : <AvatarFallback name={entry.donor?.name} />
        }
        {rank <= 3 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <Star size={7} className="text-white" fill="white" />
          </span>
        )}
      </div>

      {/* Name + count */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-main text-small truncate">
          {entry.donor?.name || 'Donor'}
        </p>
        <p className="text-[11px] text-text-light">{entry.donationCount}টি donation</p>
      </div>

      {/* Amount + flame */}
      <div className="text-right flex-shrink-0">
        <p className="font-heading font-black text-primary text-small">
          {formatCurrency(entry.totalAmount)}
        </p>
        {rank <= 5 && (
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <Flame size={10} className="text-donate" />
            <span className="text-[10px] text-donate font-semibold">Top Donor</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════
function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 h-36">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 bg-white rounded-2xl animate-pulse border border-gray-100" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100" />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function LeaderboardPage() {
  const dispatch = useAppDispatch()
  const raw      = useAppSelector(selectLeaderboard)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dispatch(fetchLeaderboard()).finally(() => setLoading(false))
  }, [dispatch])

  // ── Defensive array normalization ─────────────────────────────────────────
  // API response shape হতে পারে: array | { data: [] } | { leaderboard: [] }
  const leaderboard = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)        ? raw.data
    : Array.isArray(raw?.leaderboard) ? raw.leaderboard
    : []

  // Podium: visual order 2nd, 1st, 3rd
  const top3   = leaderboard.slice(0, 3)
  const rest   = leaderboard.slice(3)

  // Visual arrangement: [2nd, 1st, 3rd]
  const podiumVisual = [
    { entry: top3[1], rank: 2 },
    { entry: top3[0], rank: 1 },
    { entry: top3[2], rank: 3 },
  ].filter((p) => !!p.entry)

  return (
    <div className="space-y-lg pb-8">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-teal-800 p-6 text-white">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="text-amber-300" />
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">সেরা দাতা</span>
          </div>
          <h2 className="font-heading font-black text-[26px] leading-tight">
            Donor<br />Leaderboard
          </h2>
          <p className="text-[13px] text-white/60 mt-2">সর্বোচ্চ donation করা সদস্যরা</p>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && <Skeleton />}

      {/* ── Empty ── */}
      {!loading && leaderboard.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} className="text-amber-400" />
          </div>
          <p className="font-semibold text-text-secondary">এখনো কোনো donor নেই</p>
          <p className="text-small text-text-light mt-1">প্রথম donation করলেই এখানে নাম আসবে!</p>
        </div>
      )}

      {/* ── Podium ── */}
      {!loading && podiumVisual.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            শীর্ষ ৩ জন
          </p>
          <div className="flex gap-2 items-end">
            {podiumVisual.map(({ entry, rank }) => (
              <PodiumCard key={entry.donor?._id || rank} entry={entry} rank={rank} />
            ))}
          </div>
        </div>
      )}

      {/* ── Rest of list ── */}
      {!loading && rest.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            অন্যান্য
          </p>
          <div className="space-y-2.5">
            {rest.map((entry, i) => (
              <LeaderRow
                key={entry.donor?._id || i}
                entry={entry}
                rank={i + 4}
                delay={i * 0.04}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}