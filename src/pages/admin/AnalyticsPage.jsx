import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Download, RefreshCw, Target, Heart, Users, Banknote } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchAnalytics, selectAnalytics } from '@/app/store/donationSlice'
import { fetchCampaigns, selectCampaigns } from '@/app/store/campaignSlice'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ── Month labels ───────────────────────────────────────────────────────────────
const MONTHS = ['জানু','ফেব্রু','মার্চ','এপ্রি','মে','জুন','জুলা','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে']

const PALETTE = ['#0F766E','#10B981','#F59E0B','#8B5CF6','#EF4444','#3B82F6']

// ─── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-card-hover text-xs min-w-[120px]">
      <p className="font-semibold text-text-secondary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-text-main">
            {p.dataKey === 'count' ? `${p.value}টি` : formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon: Icon, delay = 0 }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-secondary' : trend < 0 ? 'text-red-500' : 'text-text-light'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-primary/8 rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-[11px] font-semibold', trendColor)}>
            <TrendIcon size={12} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="font-heading font-black text-text-main text-[24px] leading-none">{value}</p>
      <p className="text-small text-text-secondary mt-1">{label}</p>
      {sub && <p className="text-[11px] text-text-light mt-0.5">{sub}</p>}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN BREAKDOWN TABLE
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignBreakdown({ campaigns }) {
  const sorted = [...campaigns].sort((a, b) => (b.currentAmount || 0) - (a.currentAmount || 0))
  const maxAmount = sorted[0]?.currentAmount || 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="font-heading font-semibold text-text-main">Campaign অনুযায়ী সংগ্রহ</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {sorted.slice(0, 8).map((c, i) => {
          const pct = Math.round(((c.currentAmount || 0) / maxAmount) * 100)
          const goalPct = Math.min(Math.round(((c.currentAmount || 0) / c.goalAmount) * 100), 100)
          return (
            <motion.div
              key={c._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-5 py-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-small font-medium text-text-main truncate">{c.title}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-bold text-primary text-small">{formatCurrency(c.currentAmount || 0)}</p>
                  <p className="text-[10px] text-text-light">{goalPct}% of goal</p>
                </div>
              </div>
              {/* Relative bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AnalyticsPage() {
  const dispatch   = useAppDispatch()
  const analytics  = useAppSelector(selectAnalytics)
  const campaigns  = useAppSelector(selectCampaigns)
  const [loading,  setLoading]  = useState(false)
  const [chartMode, setChartMode] = useState('amount') // 'amount' | 'count'

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dispatch(fetchAnalytics()),
      dispatch(fetchCampaigns({ limit: 50 })),
    ]).finally(() => setLoading(false))
  }, [dispatch])

  // ── KPI computation ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!analytics?.totals) return {}
    const map = {}
    analytics.totals.forEach((t) => { map[t._id] = t })
    const total    = map.completed?.total || 0
    const count    = map.completed?.count || 0
    const pending  = map.pending?.count   || 0
    const avg      = count > 0 ? Math.round(total / count) : 0
    return { total, count, pending, avg }
  }, [analytics])

  // ── Monthly chart data ─────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    if (!analytics?.monthly) return []
    return [...analytics.monthly].reverse().map((m) => ({
      name:   `${MONTHS[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
      total:  m.total,
      count:  m.count,
    }))
  }, [analytics])

  // ── Month-over-month trend ─────────────────────────────────────────────────
  const trend = useMemo(() => {
    if (monthlyData.length < 2) return 0
    const cur  = monthlyData[monthlyData.length - 1]?.total || 0
    const prev = monthlyData[monthlyData.length - 2]?.total || 1
    return Math.round(((cur - prev) / prev) * 100)
  }, [monthlyData])

  // ── Pie chart: status distribution ────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!analytics?.totals) return []
    const COLORS = { completed: '#10B981', pending: '#F59E0B', failed: '#EF4444', refunded: '#8B5CF6' }
    const LABELS = { completed: 'সম্পন্ন', pending: 'অপেক্ষমাণ', failed: 'বাতিল', refunded: 'ফেরত' }
    return analytics.totals.map((t) => ({
      name:  LABELS[t._id] || t._id,
      value: t.count,
      amount: t.total || 0,
      color: COLORS[t._id] || '#94A3B8',
    }))
  }, [analytics])

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
        <div className="h-52 bg-white rounded-2xl animate-pulse border border-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-lg pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-text-main text-h2">Analytics</h2>
          <p className="text-small text-text-secondary mt-xs">বিস্তারিত পরিসংখ্যান</p>
        </div>
        <button
          onClick={() => { setLoading(true); dispatch(fetchAnalytics()).finally(() => setLoading(false)) }}
          className="p-2.5 bg-white rounded-xl border border-gray-200 text-text-secondary hover:text-primary hover:border-primary/30 transition-colors shadow-card"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Banknote} label="মোট সংগ্রহ"   value={formatCurrency(kpis.total || 0)} trend={trend} delay={0} />
        <KpiCard icon={Heart}    label="সফল donation" value={kpis.count || 0} sub="টি অনুমোদিত"  delay={0.05} />
        <KpiCard icon={Users}    label="গড় donation"  value={formatCurrency(kpis.avg || 0)} delay={0.1} />
        <KpiCard icon={Target}   label="অপেক্ষমাণ"    value={kpis.pending || 0} sub="অনুমোদন বাকি" delay={0.15} />
      </div>

      {/* Monthly trend chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-text-main">মাসিক Trend</h3>
            <div className="flex gap-1.5 bg-gray-50 rounded-xl p-1">
              {[
                { value: 'amount', label: 'টাকা' },
                { value: 'count',  label: 'সংখ্যা' },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setChartMode(m.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                    chartMode === m.value ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            {chartMode === 'amount' ? (
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0F766E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="total" name="সংগ্রহ" stroke="#0F766E" strokeWidth={2.5}
                      fill="url(#aGrad)" dot={{ r: 3, fill: '#0F766E' }} activeDot={{ r: 5 }} />
              </AreaChart>
            ) : (
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="donation সংখ্যা" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Status distribution */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <h3 className="font-heading font-semibold text-text-main mb-4">Donation অবস্থার বিভাজন</h3>
          <div className="flex items-center gap-4">
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={60} cy={60} innerRadius={35} outerRadius={58}
                   dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-text-secondary">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-text-main">{d.value}টি</span>
                    {d.amount > 0 && (
                      <span className="text-text-light ml-2 text-[10px]">{formatCurrency(d.amount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Campaign breakdown */}
      {campaigns.length > 0 && <CampaignBreakdown campaigns={campaigns} />}

    </div>
  )
}