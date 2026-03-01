import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { LogOut, Search, Menu, X, Settings, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logout, selectUser } from '@/app/store/authSlice';
import { Avatar } from '@/components/ui/Avatar';
import NotificationBell from '@/modules/social/posts/NotificationBell';
import { cn } from "../utils/mottion";

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const MENU_ITEMS = [
    { label: 'প্রোফাইল', icon: User, path: '/app/profile', roles: ['user', 'admin'] },
    { label: 'সেটিংস', icon: Settings, path: '/app/settings', roles: ['user', 'admin'] },
    { label: 'অ্যাডমিন প্যানেল', icon: ShieldCheck, path: '/admin', roles: ['admin'] },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-primary/95 backdrop-blur-md shadow-sm border-b border-white/10">
      {/* Container: এটি আপনার BottomNav এবং Main Content-এর সাথে অ্যালাইন করা */}
      <div className="max-w-5xl mx-auto px-4 h-[64px] flex items-center justify-between relative">
        
        {/* Logo Section */}
        <Link to="/app" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-primary font-black text-[16px]">RF</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-heading font-bold text-[18px] text-white">Ridwah Foundation</h1>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10 text-white/90">
            <Search size={20} />
          </button>
          <NotificationBell />
          <button 
            onClick={toggleMenu}
            className="p-2 ml-1 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all z-[60]"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* --- Drawer Logic: Max-w-5xl কন্টেইনারের ভেতরে থাকবে --- */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop: পুরো স্ক্রিন ব্লার করার জন্য */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleMenu}
                className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
              />

              {/* Drawer: এটি Header-এর absolute হিসেবে থাকবে */}
              <motion.div 
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-[70px] right-4 w-[260px] bg-white rounded-[2rem] shadow-2xl z-50 border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* User Card */}
                <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex flex-col items-center">
                  <Avatar src={user?.profilePicture} name={user?.name} className="w-14 h-14 ring-2 ring-primary/20" />
                  <p className="mt-3 font-bold text-gray-800 text-sm">{user?.name}</p>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase mt-1">
                    {user?.role || 'User'}
                  </span>
                </div>

                {/* Nav Links */}
                <div className="p-3 space-y-1">
                  {MENU_ITEMS
                    .filter(item => item.roles.includes(user?.role || 'user'))
                    .map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={toggleMenu}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 p-3 rounded-2xl transition-all font-medium text-sm",
                          isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </NavLink>
                    ))}
                </div>

                {/* Logout Button */}
                <div className="p-3 mt-auto border-t border-gray-50">
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