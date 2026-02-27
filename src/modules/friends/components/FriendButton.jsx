import { UserPlus, UserCheck, UserMinus, Clock, Loader2 } from 'lucide-react';
import useFriendship from "../hooks/useFriendship";

/**
 * FriendButton
 *
 * Reusable — যেকোনো জায়গায় শুধু userId দিলেই কাজ করে।
 * নিজে status fetch করে, নিজে actions dispatch করে।
 *
 * @param {string}  userId
 * @param {boolean} [showRemove=false] — 'accepted' state-এ Remove বাটন দেখাবে কিনা
 * @param {string}  [size='md']        — 'sm' | 'md'
 * @param {string}  [className]
 */
const FriendButton = ({ userId, showRemove = false, size = 'md', className = '' }) => {
  const { status, isStatusLoading, isActionLoading, send, remove } =
    useFriendship(userId);

  const busy = isStatusLoading || isActionLoading;

  const base =
    size === 'sm'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-colors'
      : 'inline-flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-colors';

  /* Loading skeleton while fetching status */
  if (isStatusLoading) {
    return (
      <button disabled className={`${base} bg-gray-100 text-gray-400 cursor-not-allowed ${className}`}>
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
        লোড হচ্ছে...
      </button>
    );
  }

  /* Already friends */
  if (status === 'accepted') {
    if (!showRemove) {
      return (
        <button disabled className={`${base} bg-secondary/10 text-secondary cursor-default ${className}`}>
          <UserCheck size={size === 'sm' ? 13 : 15} />
          বন্ধু আছেন
        </button>
      );
    }
    return (
      <button
        onClick={remove}
        disabled={busy}
        className={`${base} bg-red-50 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isActionLoading
          ? <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
          : <UserMinus size={size === 'sm' ? 13 : 15} />}
        বন্ধু সরান
      </button>
    );
  }

  /* Request already sent */
  if (status === 'pending') {
    return (
      <button disabled className={`${base} bg-amber-50 text-amber-600 cursor-default ${className}`}>
        <Clock size={size === 'sm' ? 13 : 15} />
        রিকোয়েস্ট পাঠানো হয়েছে
      </button>
    );
  }

  /* Default: not friends */
  return (
    <button
      onClick={send}
      disabled={busy}
      className={`${base} bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isActionLoading
        ? <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
        : <UserPlus size={size === 'sm' ? 13 : 15} />}
      বন্ধু করুন
    </button>
  );
};

export default FriendButton;