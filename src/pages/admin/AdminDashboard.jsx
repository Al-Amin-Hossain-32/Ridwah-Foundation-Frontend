import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Heart, Target,
  RefreshCw, Clock, ArrowRight, Banknote,
  AlertTriangle, BarChart3, ChevronRight,
  Zap, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchAnalytics, fetchPendingCount,
  selectAnalytics, selectPendingCount, selectAnalyticsLoad,
} from '@/app/store/donationSlice'
import { fetchCampaigns, selectCampaigns } from '@/app/store/campaignSlice'
import { fetchOverdueRecurring, selectOverdue } from '@/app/store/recurringDonationSlice'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ─── Config ────────────────────────────────────────────────────────────────────
const BN_MONTHS = ['জানু','ফেব্রু','মার্চ','এপ্রি','মে','জুন',
                   'জুলা','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে']

const STATUS = {
  completed: { label: 'সম্পন্ন',   color: '#10B981', bg: 'bg-emerald-500' },
  pending:   { label: 'অপেক্ষমাণ', color: '#F59E0B', bg: 'bg-amber-400'  },
  failed:    { label: 'বাতিল',     color: '#EF4444', bg: 'bg-red-500'    },
  refunded:  { label: 'ফেরত',      color: '#8B5CF6', bg: 'bg-violet-500' },
}

// ─── safe array ───────────────────────────────────────────────────────────────
const sa = (v) => (Array.isArray(v) ? v : [])

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED NUMBER
// ═══════════════════════════════════════════════════════════════════════════════
function CountUp({ to, duration = 1000, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const end   = Number(to) || 0
    const t0    = performance.now()

    const tick = (now) => {
      const elapsed = now - t0
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(Math.round(start + (end - start) * ease))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
      else prev.current = end
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])

  return <>{prefix}{display.toLocaleString('bn-BD')}{suffix}</>
}

// ═══════════════════════════════════════════════════════════════════════════════
// DARK TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════
function DarkTip({ active, payload, label, currency = true }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-xl px-3.5 py-3 shadow-2xl border border-white/10 text-xs min-w-[130px]">
      <p className="text-white/50 font-medium mb-2 text-[11px]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
            <span className="text-white/70">{p.name}</span>
          </div>
          <span className="font-bold text-white">
            {currency ? formatCurrency(p.value) : `${p.value}`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════════════════════════════════
function KpiCard({ icon: Icon, label, value, sub, accent, trend, pulse, delay = 0, to }) {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown
  const isPositive = trend > 0

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 180, damping: 22 }}
      className="relative bg-white rounded-2xl p-5 border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group cursor-pointer"
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] group-hover:scale-110 transition-all duration-300"
        style={{ background: accent }}
      />
      <div
        className="absolute bottom-0 left-0 h-[3px] w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `${accent}15` }}>
          <Icon size={19} style={{ color: accent }} />
        </div>

        <div className="flex items-center gap-2">
          {pulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inset-0 rounded-full opacity-60"
                    style={{ background: accent }} />
              <span className="relative rounded-full h-2 w-2" style={{ background: accent }} />
            </span>
          )}
          {trend !== undefined && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                'flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full',
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              )}
            >
              <TrendIcon size={10} />
              {Math.abs(trend)}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Value */}
      <p className="font-heading font-black text-text-main leading-none text-[26px] tracking-tight">
        {value}
      </p>
      <p className="text-small font-semibold text-text-secondary mt-1.5">{label}</p>
      {sub && <p className="text-[11px] text-text-light mt-0.5">{sub}</p>}

      {to && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 right-4"
        >
          <ChevronRight size={14} style={{ color: accent }} />
        </motion.div>
      )}
    </motion.div>
  )

  return to ? <Link to={to}>{card}</Link> : card
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function AlertBanner({ to, icon: Icon, message, variant }) {
  const styles = {
    warning: { wrap: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
    danger:  { wrap: 'bg-red-50 border-red-200',     text: 'text-red-600',   icon: 'text-red-500'   },
  }
  const s = styles[variant] || styles.warning

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <Link
        to={to}
        className={cn(
          'flex items-center justify-between rounded-2xl px-4 py-3.5 border transition-all hover:brightness-[0.97] active:scale-[0.99]',
          s.wrap
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} className={s.icon} />
          <span className={cn('text-small font-semibold', s.text)}>{message}</span>
        </div>
        <ArrowRight size={15} className={s.icon} />
      </Link>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE DONUT CHART
// ═══════════════════════════════════════════════════════════════════════════════
function StatusDonut({ data }) {
  const [active, setActive] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const shown = active !== null ? data[active] : null

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
          <Activity size={14} className="text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-text-main text-small">Donation অবস্থা</h3>
      </div>

      <div className="flex flex-col items-center">
        {/* Donut */}
        <div className="relative">
          <PieChart width={150} height={150}>
            <Pie
              data={data}
              cx={70} cy={70}
              innerRadius={42} outerRadius={62}
              dataKey="value" paddingAngle={4}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color}
                  opacity={active === null || active === i ? 1 : 0.3}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                />
              ))}
            </Pie>
          </PieChart>

          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={shown?.label ?? 'total'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.18 }}
                className="text-center"
              >
                <p className="font-heading font-black text-text-main text-[20px] leading-none">
                  {shown ? shown.value : total}
                </p>
                <p className="text-[10px] text-text-light mt-0.5">
                  {shown ? shown.label : 'মোট'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-2 mt-2">
          {data.map((d, i) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
            return (
              <div
                key={d.label}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-colors',
                  active === i ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[12px] text-text-secondary flex-1">{d.label}</span>
                <span className="text-[12px] font-bold text-text-main">{d.value}</span>
                <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: d.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA TREND CHART
// ═══════════════════════════════════════════════════════════════════════════════
function TrendChart({ data, mode, onMode }) {
  const isCurrency = mode === 'amount'
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-text-main">মাসিক Trend</h3>
          <p className="text-[11px] text-text-light mt-0.5">
            সর্বশেষ {data.length} মাস
          </p>
        </div>
        <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
          {[{ v: 'amount', l: '৳' }, { v: 'count', l: '#' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => onMode(v)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                mode === v ? 'bg-white text-primary shadow-sm' : 'text-text-light hover:text-text-secondary'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={185}>
        <AreaChart data={data} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0F766E" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#0F766E" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false}
            tickFormatter={(v) => isCurrency
              ? v >= 1000 ? `${(v/1000).toFixed(0)}k` : v
              : v
            }
          />
          <Tooltip content={<DarkTip currency={isCurrency} />} />
          <Area
            type="monotone"
            dataKey={isCurrency ? 'amount' : 'count'}
            name={isCurrency ? 'সংগ্রহ' : 'Donation'}
            stroke="#0F766E" strokeWidth={2.5}
            fill="url(#trendGrad)"
            dot={{ r: 3, fill: '#0F766E', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#0F766E', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAR CHART (donation count per month)
// ═══════════════════════════════════════════════════════════════════════════════
function CountBarChart({ data }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
          <BarChart3 size={14} className="text-violet-500" />
        </div>
        <h3 className="font-heading font-semibold text-text-main text-small">মাসিক সংখ্যা</h3>
      </div>
      <ResponsiveContainer width="100%" height={145}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -26, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <Tooltip content={<DarkTip currency={false} />} />
          <Bar dataKey="count" name="Donation" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === data.length - 1 ? '#10B981' : '#0F766E'}
                opacity={i === data.length - 1 ? 1 : 0.55}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN PROGRESS LIST
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignList({ campaigns }) {
  if (!campaigns.length) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div>
          <h3 className="font-heading font-semibold text-text-main">সক্রিয় Campaigns</h3>
          <p className="text-[11px] text-text-light mt-0.5">{campaigns.length}টি চলমান</p>
        </div>
        <Link to="/app/admin/campaigns" className="flex items-center gap-1 text-[12px] text-primary font-semibold hover:underline">
          সব <ChevronRight size={13} />
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {campaigns.slice(0, 5).map((c, i) => {
          const pct = Math.min(
            c.progressPercentage
              ?? (c.goalAmount > 0 ? Math.round(((c.currentAmount || 0) / c.goalAmount) * 100) : 0),
            100
          )
          const barColor = pct >= 100 ? '#10B981' : pct >= 75 ? '#0F766E' : '#0F766E'
          return (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 px-5 py-4"
            >
              <span className="w-6 h-6 rounded-lg bg-primary/8 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-small font-semibold text-text-main truncate mb-1.5">{c.title}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06 + 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${barColor}, ${pct >= 75 ? '#10B981' : '#14B8A6'})` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-primary w-9 text-right flex-shrink-0">{pct}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-black text-text-main">{formatCurrency(c.currentAmount || 0)}</p>
                <p className="text-[10px] text-text-light">/{formatCurrency(c.goalAmount)}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK NAV GRID
// ═══════════════════════════════════════════════════════════════════════════════
function QuickNav({ pending, activeCampaigns, overdue }) {
  const items = [
    { to: '/app/admin/donations',  icon: Heart,     label: 'Donations',  badge: pending,         accent: '#F59E0B', urgent: pending > 0         },
    { to: '/app/admin/campaigns',  icon: Target,    label: 'Campaigns',  badge: activeCampaigns, accent: '#0F766E', urgent: false                },
    { to: '/app/admin/recurring',  icon: RefreshCw, label: 'Recurring',  badge: overdue,         accent: overdue > 0 ? '#EF4444' : '#10B981', urgent: overdue > 0 },
    { to: '/app/admin/analytics',  icon: BarChart3, label: 'Analytics',  badge: null,            accent: '#8B5CF6', urgent: false                },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ to, icon: Icon, label, badge, accent, urgent }, i) => (
        <motion.div
          key={to}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.07 }}
        >
          <Link
            to={to}
            className="relative flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-card hover:shadow-card-hover active:scale-[0.97] transition-all group overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(135deg, ${accent}08, transparent)` }}
            />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                 style={{ background: `${accent}15` }}>
              <Icon size={17} style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-small font-bold text-text-main">{label}</p>
              {badge !== null && (
                <p className={cn('text-[11px] mt-0.5 font-semibold', urgent ? '' : 'text-text-light')}
                   style={urgent ? { color: accent } : {}}>
                  {urgent ? `${badge} টি জরুরি` : `${badge} টি`}
                </p>
              )}
            </div>
            {urgent && badge > 0 && (
              <span
                className="text-[10px] font-black text-white px-2 py-0.5 rounded-full flex-shrink-0 relative"
                style={{ background: accent }}
              >
                {badge}
              </span>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════
function Skeleton() {
  return (
    <div className="space-y-4 pb-8 animate-pulse">
      <div className="h-8 w-40 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />)}
      </div>
      <div className="h-60 bg-white rounded-2xl border border-gray-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const dispatch      = useAppDispatch()
  const analytics     = useAppSelector(selectAnalytics)
  const analyticsLoad = useAppSelector(selectAnalyticsLoad)
  const pendingCount  = useAppSelector(selectPendingCount)
  const campaigns     = useAppSelector(selectCampaigns)
  const overdue       = useAppSelector(selectOverdue)

  const [chartMode,   setChartMode]   = useState('amount')
  const [refreshing,  setRefreshing]  = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    await Promise.all([
      dispatch(fetchAnalytics()),
      dispatch(fetchPendingCount()),
      dispatch(fetchCampaigns({ status: 'active', limit: 20 })),
      dispatch(fetchOverdueRecurring()),
    ])
    setLastUpdated(new Date())
  }, [dispatch])

  useEffect(() => { loadAll() }, [loadAll])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  // ── KPI computation ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totals = sa(analytics?.totals)
    const map    = Object.fromEntries(totals.map((t) => [t._id, t]))
    const totalRaised  = map.completed?.total ?? 0
    const completedCt  = map.completed?.count ?? 0
    const allCount     = totals.reduce((s, t) => s + (t.count ?? 0), 0)
    const successRate  = allCount > 0 ? Math.round((completedCt / allCount) * 100) : 0
    return { totalRaised, completedCt, successRate }
  }, [analytics])

  // Month-over-month trend %
  const mom = useMemo(() => {
    const m = sa(analytics?.monthly)
    if (m.length < 2) return undefined
    const sorted = [...m].sort((a, b) =>
      a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
    )
    const cur  = sorted.at(-1)?.total ?? 0
    const prev = sorted.at(-2)?.total ?? 1
    return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0
  }, [analytics])

  // Monthly chart data (last 8 months)
const chartData = useMemo(() => {
  const monthly = Array.isArray(analytics?.monthly)
    ? [...analytics.monthly]   // ✅ clone first
    : []

  return monthly
    .sort((a, b) => {
      if (a._id.year !== b._id.year) {
        return a._id.year - b._id.year
      }
      return a._id.month - b._id.month
    })
    .slice(-8)
    .map((m) => ({
      month: BN_MONTHS[m._id.month - 1],
      amount: m.total ?? 0,
      count: m.count ?? 0,
    }))
}, [analytics?.monthly])

  // Pie data
  const pieData = useMemo(() =>
    sa(analytics?.totals).map((t) => ({
      label: STATUS[t._id]?.label ?? t._id,
      value: t.count ?? 0,
      color: STATUS[t._id]?.color ?? '#94A3B8',
    }))
  , [analytics])

  const activeCampaigns = useMemo(() => sa(campaigns).filter((c) => c.status === 'active'), [campaigns])
  const safeOverdue     = sa(overdue)

  if (analyticsLoad && !analytics) return <Skeleton />

  return (
    <div className="space-y-4 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-text-main text-h2">ড্যাশবোর্ড</h2>
          {lastUpdated && (
            <p className="text-[11px] text-text-light mt-0.5">
              সর্বশেষ আপডেট {lastUpdated.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 shadow-card"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Alert banners ── */}
      <div className="space-y-2">
        <AnimatePresence>
          {pendingCount > 0 && (
            <AlertBanner
              key="pending"
              to="/app/admin/donations"
              icon={Clock}
              message={`${pendingCount}টি donation অনুমোদনের অপেক্ষায়`}
              variant="warning"
            />
          )}
          {safeOverdue.length > 0 && (
            <AlertBanner
              key="overdue"
              to="/app/admin/recurring"
              icon={AlertTriangle}
              message={`${safeOverdue.length}টি recurring donation মেয়াদ পেরিয়েছে`}
              variant="danger"
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={Banknote} label="মোট সংগ্রহ"
          value={<CountUp to={kpis.totalRaised} prefix="৳" duration={1200} />}
          trend={mom} sub={mom !== undefined ? 'গত মাসের তুলনায়' : undefined}
          accent="#0F766E" delay={0}
        />
        <KpiCard
          icon={Heart} label="সফল Donation"
          value={<CountUp to={kpis.completedCt} duration={1000} />}
          sub={`সাফল্যের হার ${kpis.successRate}%`}
          accent="#10B981" delay={0.07}
          to="/app/admin/donations"
        />
        <KpiCard
          icon={Clock} label="অনুমোদন বাকি"
          value={<CountUp to={pendingCount} duration={800} />}
          sub={pendingCount > 0 ? 'এখনই দেখুন' : 'সব ঠিক আছে'}
          accent="#F59E0B" pulse={pendingCount > 0} delay={0.14}
          to="/app/admin/donations"
        />
        <KpiCard
          icon={Target} label="সক্রিয় Campaign"
          value={<CountUp to={activeCampaigns.length} duration={600} />}
          sub="চলমান সংগ্রহ"
          accent="#8B5CF6" delay={0.21}
          to="/app/admin/campaigns"
        />
      </div>

      {/* ── Area Trend Chart ── */}
      {chartData.length > 0 && (
        <TrendChart data={chartData} mode={chartMode} onMode={setChartMode} />
      )}

      {/* ── Donut + Bar (side by side) ── */}
      {(pieData.length > 0 || chartData.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {pieData.length > 0 && <StatusDonut data={pieData} />}
          {chartData.length > 0 && <CountBarChart data={chartData} />}
        </div>
      )}

      {/* ── Quick nav ── */}
      <QuickNav
        pending={pendingCount}
        activeCampaigns={activeCampaigns.length}
        overdue={safeOverdue.length}
      />

      {/* ── Campaign progress list ── */}
      <CampaignList campaigns={activeCampaigns} />

    </div>
  )
}