import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import {
  LogOut, Search, Menu, X, Settings, User,
  ShieldCheck, LayoutDashboard, Heart, BookOpen,
  RefreshCw, BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logout, selectUser } from '@/app/store/authSlice';
import { selectPendingCount } from '@/app/store/donationSlice';
import { Avatar } from '@/components/ui/Avatar';
import NotificationBell from '@/modules/social/posts/NotificationBell';
import SearchBar from '@/components/ui/SearchBar';
import { cn } from '../utils/mottion';

// ─── Role-based Menu Config ───────────────────────────────────────────────────
//  roles: কোন role দেখবে
//  badge: Redux selector থেকে badge value আনবে (optional)
const MENU_CONFIG = [
  {
    label: 'প্রোফাইল',
    icon: User,
    path: '/app/profile',
    roles: ['user', 'manager', 'admin'],
  },
  {
    label: 'সেটিংস',
    icon: Settings,
    path: '/app/settings',
    roles: ['user', 'manager', 'admin'],
  },
  // ── Manager / Admin only ──────────────────────────────────────────────────
  {
    label: 'ড্যাশবোর্ড',
    icon: LayoutDashboard,
    path: '/app/admin',
    roles: ['manager', 'admin'],
  },
  {
    label: 'Donation অনুমোদন',
    icon: Heart,
    path: '/app/admin/donations',
    roles: ['manager', 'admin'],
    badgeKey: 'pendingDonations', // realtime badge
  },
  {
    label: 'Campaign ব্যবস্থাপনা',
    icon: BarChart2,
    path: '/app/admin/campaigns',
    roles: ['manager', 'admin'],
  },
  {
    label: 'Analytics',
    icon: BarChart2,
    path: '/app/admin/analytics',
    roles: ['manager', 'admin'],
  },
  {
    label: 'Recurring Donations',
    icon: RefreshCw,
    path: '/app/admin/recurring',
    roles: ['manager', 'admin'],
  },
  // ── Admin only ─────────────────────────────────────────────────────────────
  {
    label: 'লাইব্রেরি ব্যবস্থাপনা',
    icon: BookOpen,
    path: '/app/admin/library',
    roles: ['admin'],
  },
  {
    label: 'অ্যাডমিন প্যানেল',
    icon: ShieldCheck,
    path: '/app/admin',
    roles: ['admin'],
  },
];

// ─── Role badge label ──────────────────────────────────────────────────────────
const ROLE_LABELS = {
  user:    { label: 'সদস্য',   color: 'bg-primary/10 text-primary' },
  manager: { label: 'ম্যানেজার', color: 'bg-amber-100 text-amber-700' },
  admin:   { label: 'অ্যাডমিন', color: 'bg-red-100 text-red-600' },
};

export function Header() {
  const dispatch     = useAppDispatch();
  const navigate     = useNavigate();
  const user         = useAppSelector(selectUser);
  const pendingCount = useAppSelector(selectPendingCount); // realtime badge

  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // close menu on role change (realtime role update)
  const role = user?.role || 'user';
  useEffect(() => { setIsMenuOpen(false); }, [role]);

  const openSearch  = () => { setIsSearchOpen(true);  setIsMenuOpen(false); };
  const closeSearch = () => setIsSearchOpen(false);
  const toggleMenu  = () => { setIsMenuOpen((v) => !v); setIsSearchOpen(false); };

  // badge value map — badgeKey → actual value
  const badgeValues = {
    pendingDonations: pendingCount,
  };

  // filter menu by current role
  const visibleItems = MENU_CONFIG.filter((item) =>
    item.roles.includes(role)
  );

  const roleStyle = ROLE_LABELS[role] || ROLE_LABELS.user;

  // total pending badge for header button (manager/admin only)
  const showHeaderBadge = ['manager', 'admin'].includes(role) && pendingCount > 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-primary/95 backdrop-blur-md shadow-sm border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-[64px] flex items-center justify-between relative">

        {/* ── Logo ── */}
        <AnimatePresence mode="wait">
          {!isSearchOpen ? (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Link to="/app" className="flex items-center gap-3 active:scale-95 transition-transform">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-inner">
                  <span className="text-primary font-black text-[16px]">RF</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-heading font-bold text-[18px] text-white">Ridwah Foundation</h1>
                </div>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, width: '40px' }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: '40px' }}
              transition={{ duration: 0.2 }}
              className="flex-1 mr-3 relative"
            >
              <SearchBar onClose={closeSearch} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Right Actions ── */}
        {!isSearchOpen && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openSearch}
              className="p-2 rounded-full hover:bg-white/10 text-white/90 transition-all active:scale-95"
            >
              <Search size={20} />
            </button>

            <NotificationBell />

            {/* Menu button — pending badge সহ */}
            <button
              onClick={toggleMenu}
              className="relative p-2 ml-1 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all z-[60]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}

              {/* Realtime pending donation badge */}
              <AnimatePresence>
                {showHeaderBadge && !isMenuOpen && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-donate text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-donate"
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}

        {/* ── Dropdown Drawer ── */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleMenu}
                className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-[70px] right-4 w-[270px] bg-white rounded-[2rem] shadow-2xl z-50 border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* ── User Card ── */}
                <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex flex-col items-center">
                  {/* Avatar with realtime online ring */}
                  <div className="relative">
                    <Avatar
                      src={user?.profilePicture}
                      name={user?.name}
                      className="w-14 h-14 ring-2 ring-primary/20"
                    />
                    {/* Online indicator */}
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-white" />
                  </div>
                  <p className="mt-3 font-bold text-gray-800 text-sm">{user?.name}</p>
                  <p className="text-[11px] text-gray-400">{user?.email}</p>

                  {/* Role badge — role পরিবর্তন হলে realtime বদলাবে */}
                  <motion.span
                    key={role} // role বদলালে re-animate
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      'text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase mt-1.5',
                      roleStyle.color
                    )}
                  >
                    {roleStyle.label}
                  </motion.span>
                </div>

                {/* ── Nav Links ── */}
                <div className="p-3 space-y-0.5 max-h-[55vh] overflow-y-auto">
                  {visibleItems.map((item) => {
                    const badgeVal = item.badgeKey ? badgeValues[item.badgeKey] : 0;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={toggleMenu}
                        className={({ isActive }) => cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all font-medium text-sm',
                          isActive
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        )}
                      >
                        <item.icon size={17} />
                        <span className="flex-1">{item.label}</span>

                        {/* Realtime badge (pending donations etc.) */}
                        <AnimatePresence>
                          {badgeVal > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="min-w-[20px] h-5 bg-donate text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                            >
                              {badgeVal > 99 ? '99+' : badgeVal}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </NavLink>
                    );
                  })}
                </div>

                {/* ── Logout ── */}
                <div className="p-3 border-t border-gray-50">
                  <button
                    onClick={() => { dispatch(logout()); navigate('/login'); }}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all font-bold text-xs"
                  >
                    <LogOut size={16} />
                    লগআউট
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </header>
  );
}