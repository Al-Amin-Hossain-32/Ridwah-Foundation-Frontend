import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchNotifications,
  markRead,
  markAllRead,
  selectNotifications,
  selectUnreadCount,
} from '@/app/store/notificationSlice';
import { Bell, CheckCheck, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import moment from 'moment';
import { Link } from 'react-router-dom';

const NOTIF_ICON = {
  post_reaction: '❤️',
  comment_reaction: '😍',
  reply_reaction: '💬',
  comment: '💬',
  reply: '↩️',
  mention: '@',
};

export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) dispatch(markRead(notif._id));
    setOpen(false);
  };

  const handleMarkAll = () => {
    dispatch(markAllRead());
  };

  return (
    <div className="relative" ref={ref}>
      {/* ── Bell Button ── */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-white/10 text-white/90 transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-primary px-0.5 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-base">নোটিফিকেশন</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck size={13} /> সব পড়া হয়েছে
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">কোনো নোটিফিকেশন নেই</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotifItem
                  key={notif._id}
                  notif={notif}
                  onClick={() => handleNotifClick(notif)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-50 py-2 text-center">
              <Link
                to="/app/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-primary font-medium hover:underline"
              >
                সব নোটিফিকেশন দেখুন
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItem({ notif, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
        !notif.read ? 'bg-blue-50/60' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={notif.sender?.profilePicture}
          name={notif.sender?.name}
          className="w-10 h-10"
        />
        <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
          {NOTIF_ICON[notif.type] || '🔔'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">
          {notif.message}
        </p>
        <p className="text-[11px] text-primary font-medium mt-0.5">
          {moment(notif.createdAt).fromNow()}
        </p>
      </div>

      {!notif.read && (
        <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}
