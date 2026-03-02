import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, SlidersHorizontal, X, Trophy,
  Target, TrendingUp, Clock, CheckCircle,
  Flame, RefreshCw, ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchCampaigns,
  selectCampaigns,
  selectCampaignLoad,
} from '@/app/store/campaignSlice'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ─── Config ────────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: 'active',    label: 'চলমান',       icon: Flame },
  { value: 'completed', label: 'সম্পন্ন',     icon: CheckCircle },
  { value: 'expired',   label: 'মেয়াদ শেষ',  icon: Clock },
]

const SORT_OPTIONS = [
  { value: 'newest',   label: 'নতুন আগে'          },
  { value: 'progress', label: 'অগ্রগতি (বেশি)'     },
  { value: 'deadline', label: 'শেষ তারিখ (কাছের)'  },
  { value: 'goal_low', label: 'লক্ষ্য (কম)'         },
  { value: 'goal_high',label: 'লক্ষ্য (বেশি)'        },
]

const PROGRESS_FILTERS = [
  { value: '',     label: 'সবগুলো'  },
  { value: '0',    label: '০–২৫%'   },
  { value: '25',   label: '২৫–৫০%'  },
  { value: '50',   label: '৫০–৭৫%'  },
  { value: '75',   label: '৭৫–১০০%' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeArr = (v) => (Array.isArray(v) ? v : [])

const progressOf = (c) =>
  c.goalAmount > 0
    ? Math.min(Math.round(((c.currentAmount || 0) / c.goalAmount) * 100), 100)
    : 0

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER BOTTOM SHEET
// ═══════════════════════════════════════════════════════════════════════════════
function FilterSheet({ filters, onChange, onClose }) {
  const [local, setLocal] = useState(filters)
  const set = (k, v) => setLocal((p) => ({ ...p, [k]: v }))

  const activeCount = [
    local.sort !== 'newest' ? 1 : 0,
    local.progress ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

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
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-text-main">Filter ও Sort</h3>
          <button
            onClick={() => { onChange({ sort: 'newest', progress: '' }); onClose() }}
            className="text-[12px] text-primary font-medium"
          >
            Reset
          </button>
        </div>

        {/* Sort */}
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">সাজানো</p>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => set('sort', s.value)}
                className={cn(
                  'py-2.5 rounded-xl text-small font-semibold border-2 transition-all',
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

        {/* Progress filter */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">অগ্রগতি</p>
          <div className="flex flex-wrap gap-2">
            {PROGRESS_FILTERS.map((p) => (
              <button
                key={p.value}
                onClick={() => set('progress', p.value)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-small font-semibold border-2 transition-all',
                  local.progress === p.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-100 text-text-secondary'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { onChange(local); onClose() }}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-small"
        >
          প্রয়োগ করুন {activeCount > 0 && `(${activeCount})`}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN CARD
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignCard({ campaign, index }) {
  const pct      = progressOf(campaign)
  const daysLeft = campaign.daysRemaining ?? null
  const isHot    = pct >= 75 || (daysLeft !== null && daysLeft <= 3 && daysLeft >= 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={`/app/donate/${campaign._id}/pay`}
        className="block bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all overflow-hidden"
      >
        {/* Cover */}
        {campaign.coverImage?.url ? (
          <div className="h-36 overflow-hidden relative">
            <img
              src={campaign.coverImage.url}
              alt={campaign.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Hot badge */}
            {isHot && (
              <span className="absolute top-3 left-3 flex items-center gap-1 bg-donate text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Flame size={10} />
                {pct >= 75 ? 'লক্ষ্যের কাছে!' : 'শেষ হচ্ছে!'}
              </span>
            )}

            {/* Days left chip */}
            {daysLeft !== null && (
              <span className={cn(
                'absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full',
                daysLeft <= 3
                  ? 'bg-red-500 text-white'
                  : daysLeft <= 7
                  ? 'bg-amber-400 text-white'
                  : 'bg-black/40 text-white'
              )}>
                {daysLeft > 0 ? `${daysLeft} দিন` : 'আজ শেষ'}
              </span>
            )}
          </div>
        ) : (
          /* No cover — colored placeholder */
          <div
            className="h-3 w-full"
            style={{
              background: pct >= 100
                ? 'linear-gradient(90deg, #10B981, #0F766E)'
                : `linear-gradient(90deg, #0F766E ${pct}%, #E5E7EB ${pct}%)`,
            }}
          />
        )}

        <div className="p-4">
          {/* Title */}
          <h3 className="font-heading font-semibold text-text-main leading-snug line-clamp-2 mb-3">
            {campaign.title}
          </h3>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="font-bold text-primary">{formatCurrency(campaign.currentAmount || 0)}</span>
              <span className="text-text-light">লক্ষ্য {formatCurrency(campaign.goalAmount)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: index * 0.04 + 0.1, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  pct >= 100
                    ? 'bg-gradient-to-r from-secondary to-emerald-400'
                    : pct >= 75
                    ? 'bg-gradient-to-r from-primary to-secondary'
                    : 'bg-gradient-to-r from-primary to-teal-400'
                )}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-text-light">
              {/* Donor count */}
              {campaign.donorCount > 0 && (
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  {campaign.donorCount} জন
                </span>
              )}
              {/* Progress % */}
              <span className={cn(
                'font-bold',
                pct >= 100 ? 'text-secondary' : pct >= 75 ? 'text-primary' : 'text-text-secondary'
              )}>
                {pct}%
              </span>
            </div>

            {/* CTA chip */}
            <span className="text-[11px] font-bold text-primary bg-primary/8 px-3 py-1 rounded-full">
              Donate করুন →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-36 bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
            <div className="h-2 bg-gray-100 rounded-full" />
            <div className="flex justify-between">
              <div className="h-3 bg-gray-100 rounded-full w-20" />
              <div className="h-3 bg-gray-100 rounded-full w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY BANNER (active campaigns stats)
// ═══════════════════════════════════════════════════════════════════════════════
function SummaryBanner({ campaigns }) {
  const arr = safeArr(campaigns)
  if (arr.length === 0) return null

  const totalRaised   = arr.reduce((s, c) => s + (c.currentAmount || 0), 0)
  const activeCnt     = arr.filter((c) => c.status === 'active').length
  const completedCnt  = arr.filter((c) => c.status === 'completed').length

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'সক্রিয়',   value: activeCnt,                  color: 'text-primary'   },
        { label: 'মোট তোলা', value: formatCurrency(totalRaised), color: 'text-secondary' },
        { label: 'সম্পন্ন',  value: completedCnt,                color: 'text-text-main' },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-white rounded-xl p-3 border border-gray-100 shadow-card text-center"
        >
          <p className={cn('font-heading font-black text-[16px] leading-none', s.color)}>{s.value}</p>
          <p className="text-[10px] text-text-secondary mt-1">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CampaignListPage() {
  const dispatch  = useAppDispatch()
  const rawList   = useAppSelector(selectCampaigns)
  const loading   = useAppSelector(selectCampaignLoad)

  const campaigns = safeArr(rawList)

  const [search,      setSearch]      = useState('')
  const [statusTab,   setStatusTab]   = useState('active')
  const [filters,     setFilters]     = useState({ sort: 'newest', progress: '' })
  const [showFilter,  setShowFilter]  = useState(false)

  // Load on mount and when status tab changes
  useEffect(() => {
    dispatch(fetchCampaigns({ status: statusTab }))
  }, [dispatch, statusTab])

  // Active filter count
  const activeFilters = [
    filters.sort !== 'newest' ? 1 : 0,
    filters.progress ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  // ── Filter + sort pipeline ─────────────────────────────────────────────────
  const processed = useMemo(() => {
    let list = [...campaigns]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }

    // Progress range filter
    if (filters.progress !== '') {
      const min = Number(filters.progress)
      const max = min + 25
      list = list.filter((c) => {
        const p = progressOf(c)
        return p >= min && p < max
      })
    }

    // Sort
    switch (filters.sort) {
      case 'progress':
        list.sort((a, b) => progressOf(b) - progressOf(a))
        break
      case 'deadline':
        list.sort((a, b) => {
          const dA = a.daysRemaining ?? 9999
          const dB = b.daysRemaining ?? 9999
          return dA - dB
        })
        break
      case 'goal_low':
        list.sort((a, b) => (a.goalAmount || 0) - (b.goalAmount || 0))
        break
      case 'goal_high':
        list.sort((a, b) => (b.goalAmount || 0) - (a.goalAmount || 0))
        break
      default: // newest
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return list
  }, [campaigns, search, filters])

  const handleRefresh = useCallback(() => {
    dispatch(fetchCampaigns({ status: statusTab }))
  }, [dispatch, statusTab])

  return (
    <div className="page-wrapper space-y-md pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-text-main text-h2">Campaigns</h2>
          <p className="text-small text-text-secondary mt-xs">আপনার পছন্দের campaign এ donate করুন</p>
        </div>

        {/* Leaderboard shortcut */}
        <Link
          to="/app/donate/leaderboard"
          className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-[12px] font-bold hover:bg-amber-100 transition-colors"
        >
          <Trophy size={14} />
          Top Donors
        </Link>
      </div>

      {/* ── Summary ── */}
      {!loading && <SummaryBanner campaigns={campaigns} />}

      {/* ── Status tabs ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {STATUS_TABS.map(({ value, label, icon: Icon }) => {
          const count = campaigns.filter((c) => c.status === value).length
          return (
            <button
              key={value}
              onClick={() => setStatusTab(value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-small font-semibold whitespace-nowrap transition-all flex-shrink-0',
                statusTab === value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text-secondary border border-gray-200'
              )}
            >
              <Icon size={13} />
              {label}
              {count > 0 && (
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  statusTab === value ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search + Filter row ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Campaign খুঁজুন..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-small text-text-main focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
            >
              <X size={13} className="text-text-light" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilter(true)}
          className={cn(
            'relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-small font-semibold transition-all',
            activeFilters > 0
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-text-secondary border-gray-200'
          )}
        >
          <SlidersHorizontal size={15} />
          {activeFilters > 0 && (
            <span className="w-4 h-4 bg-white/25 rounded-full text-[9px] font-black flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2.5 bg-white rounded-xl border border-gray-200 text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Result info ── */}
      {!loading && (
        <p className="text-[12px] text-text-light px-0.5">
          {processed.length}টি campaign
          {search && ` — "${search}"`}
          {filters.progress && ` · ${PROGRESS_FILTERS.find((p) => p.value === filters.progress)?.label}`}
        </p>
      )}

      {/* ── Content ── */}
      {loading ? (
        <CampaignSkeleton />
      ) : processed.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-primary/30" />
          </div>
          <p className="font-semibold text-text-secondary">
            {search
              ? `"${search}" এর জন্য কিছু পাওয়া যায়নি`
              : `${STATUS_TABS.find((t) => t.value === statusTab)?.label} কোনো campaign নেই`}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-primary text-small font-medium"
            >
              Search মুছুন
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {processed.map((c, i) => (
              <CampaignCard key={c._id} campaign={c} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Filter sheet ── */}
      <AnimatePresence>
        {showFilter && (
          <FilterSheet
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilter(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}