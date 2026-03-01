import { Outlet } from 'react-router-dom';
import { Header } from './Header'; // নতুন ইমপোর্ট
import { BottomNav } from './BottomNav';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '../utils/mottion';
import FloatingChatButton from '../pages/chat/FloatingChatButton';

export function AppLayout() {
  useSocket(); 

  return (
    <div className="min-h-screen mx-auto bg-bg-main">
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