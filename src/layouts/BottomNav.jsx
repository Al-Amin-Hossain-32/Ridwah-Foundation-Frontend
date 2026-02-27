import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Heart, BookOpen, MessageCircle, User } from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';
import { selectUnreadCount } from '@/app/store/chatSlice';
import { cn } from "../utils/mottion"; // Tailwind merge utility class

const NAV_ITEMS = [
  { id: 'home',    to: '/app',         label: 'Home',    icon: Home,         end: true },
  { id: 'donate',  to: '/app/donate',  label: 'Donate',  icon: Heart                   },
  { id: 'library', to: '/app/library', label: 'Library', icon: BookOpen                },
  { id: 'chat',    to: '/app/chat',    label: 'Chat',    icon: MessageCircle, badge: true },
  { id: 'profile', to: '/app/profile', label: 'Profile', icon: User                    },
];

export function BottomNav() {
  const unreadCount = useAppSelector(selectUnreadCount);
  const location = useLocation();

  return (
    <nav className="max-w-5xl mx-auto fixed bottom-0 left-0 right-0 z-50 h-[68px] bg-white/80 backdrop-blur-lg border-t border-gray-100 px-2 flex items-center justify-around shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge, id }) => (
        <NavLink
          key={id}
          to={to}
          end={end}
          className="relative flex-1 group"
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center justify-center py-2 relative">
              {/* Active Background Pill Effect */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 mx-auto w-12 h-12 bg-primary/10 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon Section */}
              <motion.div
                animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                className={cn(
                  "relative transition-colors duration-300",
                  isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />

                {/* Unread Badge */}
                {badge && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white shadow-sm"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.div>

              {/* Label */}
              <span className={cn(
                "text-[10px] mt-1 font-semibold tracking-wide transition-all duration-300",
                isActive ? "text-primary opacity-100" : "text-gray-400 opacity-80"
              )}>
                {label}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(15,118,110,0.5)]" 
                />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}