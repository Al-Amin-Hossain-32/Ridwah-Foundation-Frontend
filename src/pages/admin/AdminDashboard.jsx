import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Users, Heart, BookOpen, Clock, CheckCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchAllDonations, selectAllDonations } from '@/app/store/donationSlice'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

const ADMIN_LINKS = [
  { to: '/app/admin/donations',  icon: Heart,    label: 'Donation Manage',  color: 'bg-donate/10 text-donate' },
  { to: '/app/admin/campaigns',  icon: BarChart2, label: 'Campaign Manage',  color: 'bg-primary/10 text-primary' },
  { to: '/app/admin/library',    icon: BookOpen,  label: 'Library Manage',   color: 'bg-blue-50 text-blue-600' },
  { to: '/app/admin/users',      icon: Users,     label: 'Users',            color: 'bg-purple-50 text-purple-600' },
]

export default function AdminDashboard() {
  const dispatch  = useAppDispatch()
  const donations = useAppSelector(selectAllDonations)

  useEffect(() => {
    dispatch(fetchAllDonations({ limit: 5 }))
  }, [dispatch])

  const pending  = donations.filter((d) => d.status === 'pending')
  const approved = donations.filter((d) => d.status === 'approved')
  const totalRaised = approved.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="page-wrapper">
      <h2 className="font-heading text-text-main mb-lg">Admin Panel</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-sm mb-lg">
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-primary text-[22px]">
            {formatCurrency(totalRaised)}
          </p>
          <p className="text-[12px] text-text-secondary">Total Raised</p>
        </Card>
        <Card className="text-center !p-3 relative">
          <p className="font-heading font-bold text-donate text-[22px]">{pending.length}</p>
          <p className="text-[12px] text-text-secondary">Pending</p>
          {pending.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-donate rounded-full animate-pulse" />
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-sm mb-lg">
        {ADMIN_LINKS.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}>
            <Card className="flex flex-col items-center gap-sm py-5 text-center">
              <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <p className="font-medium text-text-main text-small">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending donations */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-heading text-text-main mb-sm flex items-center gap-xs">
            <Clock size={16} className="text-donate" />
            Pending Donations ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.slice(0, 5).map((d) => (
              <Link key={d._id} to={`/app/admin/donations/${d._id}`}>
                <Card className="flex items-center justify-between gap-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-medium text-text-main truncate">
                      {d.donor?.name || 'Anonymous'}
                    </p>
                    <p className="text-[12px] text-text-secondary">{d.paymentMethod}</p>
                  </div>
                  <div className="flex items-center gap-xs flex-shrink-0">
                    <p className="font-bold text-primary text-small">{formatCurrency(d.amount)}</p>
                    <Badge variant="pending">Pending</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
