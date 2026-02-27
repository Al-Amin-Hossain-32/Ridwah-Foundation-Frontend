import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, LogOut, Search, Settings } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { logout, selectUser } from '@/app/store/authSlice'
import { Avatar } from '@/components/ui/Avatar'
import { BottomNav } from './BottomNav'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '../utils/mottion'
import FloatingChatButton from '../pages/chat/FloatingChatButton'

export function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector(selectUser)

  // Socket connection initialized globally
  useSocket()

  const handleLogout = () => {
    // সরাসরি ডিলিট না করে একটি কনফার্মেশন প্রম্পট রাখা ভালো
    if (window.confirm("আপনি কি লগআউট করতে চান?")) {
      dispatch(logout())
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen mx-auto bg-bg-main">
      {/* 🟢 NAVBAR: Sticky with Glassmorphism */}
      <header className="sticky top-0 z-40 w-full bg-primary/95 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-[64px] flex items-center justify-between">
          
          {/* Logo & Branding */}
          <Link to="/app" className="flex items-center gap-3 transition-transform active:scale-95">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-primary font-black text-[16px]">RF</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-bold text-[18px] text-white leading-none">
                Ridwah Foundation
              </h1>
              <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">
                Empowering Lives
              </p>
            </div>
          </Link>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* Search Icon (Pro addition) */}
            <button className="p-2 rounded-full hover:bg-white/10 text-white/90 transition-all">
              <Search size={20} />
            </button>

            {/* Notifications with Badge */}
            <button className="relative p-2 rounded-full hover:bg-white/10 text-white/90 transition-all">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-primary" />
            </button>

            {/* Profile & Logout (Senior approach: Separating concerns) */}
            <div className="flex items-center gap-1 ml-1 bg-white/10 p-1 rounded-full border border-white/5">
              <Link to="/app/profile">
                <Avatar
                  src={user?.profilePicture}
                  name={user?.name}
                  className="w-8 h-8 ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95"
                />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-full hover:bg-red-500/20 text-white/60 hover:text-red-200 transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🔵 MAIN CONTENT AREA */}
      <main className={cn(
        "max-w-5xl mx-auto px-4 py-6 min-h-[calc(100vh-64px-68px)]",
        "pb-[90px] md:pb-8 animate-in fade-in duration-500" // Bottom margin for mobile nav
      )}>
        <Outlet />
      </main>

      {/* 🔴 BOTTOM NAVIGATION (Only for Mobile & Tablets) */}
      <BottomNav />
      <FloatingChatButton />
      
      {/* ডেস্কটপ বা লার্জ স্ক্রিনের জন্য সাইডবার বা অন্য কোনো লজিক লাগলে এখানে আসবে */}
    </div>
  )
}