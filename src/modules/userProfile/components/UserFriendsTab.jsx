import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { fetchUserFriends, selectProfileFriends } from '../userProfileSlice';
import FriendButton from '@/modules/friends/components/FriendButton';

/* ── FriendMiniCard ──────────────────────────────────────────── */
const FriendMiniCard = ({ friend }) => (
  <div className="bg-card rounded-card shadow-card p-3 flex flex-col items-center gap-2 hover:shadow-card-hover transition-shadow text-center group">
    <Link to={`/app/user/${friend._id}`} className="block">
      <img
        src={friend.profilePicture || '/avatar.png'}
        alt={friend.name}
        onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
        className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all"
      />
    </Link>
    <div className="min-w-0 w-full">
      <Link
        to={`/app/user/${friend._id}`}
        className="text-sm font-medium text-text-main hover:text-primary transition-colors block truncate"
      >
        {friend.name}
      </Link>
      <p className="text-xs text-text-light truncate">@{friend.username}</p>
    </div>
    {/* FriendButton: আমার সাথে এই friend-এর status দেখাবে */}
    <FriendButton userId={friend._id} size="sm" showRemove />
  </div>
);

/* ── Skeleton ─────────────────────────────────────────────────── */
const FriendSkeleton = () => (
  <div className="bg-card rounded-card shadow-card p-3 flex flex-col items-center gap-2 animate-pulse">
    <div className="w-16 h-16 rounded-full bg-gray-200" />
    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
    <div className="h-3 bg-gray-100 rounded w-1/2" />
  </div>
);

/* ── Main Tab ─────────────────────────────────────────────────── */
const UserFriendsTab = ({ userId }) => {
  const dispatch = useDispatch();
  const { friends, hasMore, page, total, loading, friendCount } =
    useSelector(selectProfileFriends);

  useEffect(() => {
    if (userId) dispatch(fetchUserFriends({ userId, page: 1 }));
  }, [userId, dispatch]);

  const loadMore = () => {
    if (hasMore && !loading) dispatch(fetchUserFriends({ userId, page: page + 1 }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-text-secondary font-medium">
          মোট {friendCount} বন্ধু
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {loading && friends.length === 0 &&
          [1, 2, 3, 4, 5, 6].map((i) => <FriendSkeleton key={i} />)
        }
        {friends.map((f) => <FriendMiniCard key={f._id} friend={f} />)}
      </div>

      {/* Empty */}
      {!loading && friends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Users size={24} className="text-primary/50" />
          </div>
          <p className="font-medium text-text-secondary">এখনো কোনো বন্ধু নেই</p>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-4 w-full py-2.5 rounded-card bg-card shadow-card text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> লোড হচ্ছে...</span>
            : `আরো দেখুন (${total - friends.length} জন বাকি)`}
        </button>
      )}
    </div>
  );
};

export default UserFriendsTab;