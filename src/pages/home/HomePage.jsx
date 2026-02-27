import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Trophy, BookOpen, Heart, RefreshCw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchCampaigns, selectCampaigns, selectCampaignLoad } from '@/app/store/campaignSlice'
import { fetchLeaderboard, selectLeaderboard }                  from '@/app/store/donationSlice'
import { fetchTimeline, selectTimeline, selectPostLoading }     from '@/app/store/postSlice'
import { selectUser }                                           from '@/app/store/authSlice'
import { Button }      from '@/components/ui/Button'
import { Card }        from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Loader'
import { Avatar }      from '@/components/ui/Avatar'
import { EmptyState }  from '@/components/ui/EmptyState'
import { CampaignCard } from '@/modules/donations/CampaignCard'
import { PostCard }     from '@/modules/social/PostCard'
import { formatCurrency } from '@/utils/formatters'

export default function HomePage() {
  const dispatch = useAppDispatch()

  // Redux state
  const user        = useAppSelector(selectUser)
  const campaigns   = useAppSelector(selectCampaigns)
  const leaderboard = useAppSelector(selectLeaderboard)
  const posts       = useAppSelector(selectTimeline)
  const campLoad    = useAppSelector(selectCampaignLoad)
  const postLoad    = useAppSelector(selectPostLoading)

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchCampaigns({ limit: 3, isActive: true }))
    dispatch(fetchLeaderboard())
    dispatch(fetchTimeline())
  }, [dispatch])

  return (
    <div className="page-wrapper space-y-lg">

      {/* ── Greeting ─────────────────────────── */}
      <div className="pt-xs">
        <p className="text-text-secondary text-small">আজকের দিন শুভ হোক 🌟</p>
        <h2 className="font-heading text-text-main">
          {user?.name?.split(' ')[0] || 'বন্ধু'} 👋
        </h2>
      </div>

      {/* ── Stats Banner ─────────────────────── */}
      <div
        className="rounded-[18px] p-lg text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)' }}
      >
        {/* Background pattern */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative">
          <p className="text-white/70 text-small mb-xs">আপনার মোট Donation</p>
          <p className="font-heading font-bold text-[32px] leading-none">
            {formatCurrency(user?.totalDonation || 0)}
          </p>

          <div className="flex items-center gap-sm mt-md">
            <Link to="/app/donate">
              <Button variant="donate" size="sm">
                <Heart size={15} />
                Donate করুন
              </Button>
            </Link>
            <Link
              to="/app/donate/history"
              className="text-white/80 text-small flex items-center gap-xs hover:text-white transition-colors"
            >
              History <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Featured Campaigns ───────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-text-main">চলমান Campaigns</h3>
          <Link
            to="/app/donate"
            className="text-primary text-small flex items-center gap-xs font-medium"
          >
            সব দেখুন <ArrowRight size={14} />
          </Link>
        </div>

        {campLoad ? (
          <CardSkeleton count={2} />
        ) : campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.slice(0, 3).map((c) => (
              <CampaignCard key={c._id} campaign={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon="📭" title="কোনো campaign নেই" />
        )}
      </section>

      {/* ── Top Donors Leaderboard ───────────── */}
      {leaderboard.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-donate" />
            <h3 className="font-heading text-text-main">Top Donors</h3>
          </div>

          <Card>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((donor, i) => (
                <div key={i} className="flex items-center gap-sm">
                  {/* Rank badge */}
                  <div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center
                      text-[12px] font-bold flex-shrink-0
                      ${i === 0 ? 'bg-donate text-white'
                        : i === 1 ? 'bg-gray-300 text-gray-700'
                        : i === 2 ? 'bg-amber-600/80 text-white'
                        : 'bg-gray-100 text-text-secondary'}
                    `}
                  >
                    {i + 1}
                  </div>
                  <Avatar src={donor.avatar} name={donor.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-main text-small truncate">
                      {donor.name || 'Anonymous'}
                    </p>
                    <p className="text-[13px] text-text-light">
                      {formatCurrency(donor.totalDonated)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ── Library Highlight ────────────────── */}
      <Card className="flex items-center gap-md border border-primary/10 bg-primary/[0.03]">
        <div className="w-12 h-12 bg-primary/10 rounded-[12px] flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-text-main">Library</p>
          <p className="text-small text-text-secondary">বই পড়ুন, জ্ঞান বাড়ান</p>
        </div>
        <Link to="/app/library">
          <Button variant="ghost" size="sm">খুলুন →</Button>
        </Link>
      </Card>

      {/* ── Foundation Posts ─────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-text-main">Foundation Posts</h3>
          <Link
            to="/app/social"
            className="text-primary text-small flex items-center gap-xs font-medium"
          >
            সব <ArrowRight size={14} />
          </Link>
        </div>

        {postLoad ? (
          <CardSkeleton count={2} />
        ) : posts.length > 0 ? (
          posts.slice(0, 3).map((p) => <PostCard key={p._id} post={p} />)
        ) : (
          <EmptyState icon="✍️" title="কোনো post নেই" />
        )}
      </section>

    </div>
  )
}
