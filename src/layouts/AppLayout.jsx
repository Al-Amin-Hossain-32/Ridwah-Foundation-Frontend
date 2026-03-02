import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useSocket } from '@/hooks/useSocket';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectUser } from '@/app/store/authSlice';
import { fetchPendingCount } from '@/app/store/donationSlice';
import { cn } from '../utils/mottion';
import FloatingChatButton from '../pages/chat/FloatingChatButton';

export function AppLayout() {
  useSocket();

  const dispatch = useAppDispatch();
  const user     = useAppSelector(selectUser);

  // manager/admin হলে app load হওয়ার সাথে সাথে pending count আনো
  useEffect(() => {
    if (['manager', 'admin'].includes(user?.role)) {
      dispatch(fetchPendingCount());
    }
  }, [user?.role, dispatch]);

  return (
    <div className="bg-gradient-to-br from-bg to-primary-50 min-h-screen mx-auto bg-bg-main">
      <Header />

      <main className={cn(
        'max-w-5xl mx-auto px-4 py-6 min-h-[calc(100vh-64px-68px)]',
        'pb-[90px] md:pb-8 animate-in fade-in duration-500'
      )}>
        <Outlet />
      </main>

      <BottomNav />
      <FloatingChatButton />
    </div>
  );
}