import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchCampaigns, selectCampaigns, selectCampaignLoad } from '@/app/store/campaignSlice'
import { Input }        from '@/components/ui/Input'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState }   from '@/components/ui/EmptyState'
import { CampaignCard } from '@/modules/donations/CampaignCard'

export default function CampaignListPage() {
  const dispatch  = useAppDispatch()
  const campaigns = useAppSelector(selectCampaigns)
  const loading   = useAppSelector(selectCampaignLoad)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchCampaigns({ isActive: true }))
  }, [dispatch])

  const filtered = campaigns.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="mb-lg">
        <h2 className="font-heading text-text-main mb-xs">সকল Campaigns</h2>
        <p className="text-small text-text-secondary">
          আপনার পছন্দের campaign এ donate করুন
        </p>
      </div>

      {/* Search */}
      <div className="mb-md">
        <Input
          placeholder="Campaign খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search size={16} />}
        />
      </div>

      {/* List */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CampaignCard key={c._id} campaign={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title="কোনো campaign পাওয়া যায়নি"
          description={search ? `"${search}" এর জন্য কোনো result নেই` : undefined}
        />
      )}
    </div>
  )
}
