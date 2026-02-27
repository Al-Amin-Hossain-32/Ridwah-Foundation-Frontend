import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Clock, Check, X, UserMinus, UserPlus } from 'lucide-react';
import { fetchFriends, fetchRequests, acceptFriendRequest, rejectFriendRequest, removeFriend } from '@/modules/friends/friend.thunks';
import { selectFriends, selectRequests, selectFriendLoading } from '@/modules/friends/friendSlice';

/* ── Skeleton Card ───────────────────────────────────────────── */
const SkeletonFriendCard = () => (
  <div className="bg-card rounded-card shadow-card overflow-hidden animate-pulse">
    <div className="h-24 bg-gray-100" />
    <div className="px-4 pb-4 -mt-8 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-gray-200 ring-4 ring-card mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-100 rounded-btn w-full" />
    </div>
  </div>
);

const SkeletonRequestCard = () => (
  <div className="bg-card rounded-card shadow-card p-4 flex items-center gap-3 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-2/5" />
      <div className="h-3 bg-gray-100 rounded w-1/4" />
    </div>
    <div className="flex gap-2">
      <div className="w-20 h-8 bg-gray-100 rounded-btn" />
      <div className="w-20 h-8 bg-gray-100 rounded-btn" />
    </div>
  </div>
);

/* ── Friend Card (grid) ──────────────────────────────────────── */
const FriendCard = ({ friend }) => {
  const dispatch   = useDispatch();
  const { action } = useSelector(selectFriendLoading);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="bg-card rounded-card shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-200 group">
      {/* Mini cover — gradient background */}
      <div className="h-20 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 relative">
        {friend.coverPhoto && (
          <img
            src={friend.coverPhoto}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4 pb-4 -mt-8 flex flex-col items-center text-center">
        {/* Avatar */}
        <Link to={`/app/user/${friend._id}`}>
          <img
            src={friend.profilePicture || '/avatar.png'}
            alt={friend.name}
            onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-card shadow-md group-hover:ring-primary/20 transition-all"
          />
        </Link>

        {/* Info */}
        <Link
          to={`/app/user/${friend._id}`}
          className="mt-2 font-semibold text-text-main hover:text-primary transition-colors text-sm leading-tight line-clamp-1"
        >
          {friend.name}
        </Link>
        <p className="text-xs text-text-light mt-0.5">@{friend.username}</p>
        {friend.bio && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-1 px-2">
            {friend.bio}
          </p>
        )}

        {/* Remove button */}
        <button
          onClick={() => dispatch(removeFriend(friend._id))}
          disabled={action}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-btn transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${hovered
              ? 'bg-red-500 text-white'
              : 'bg-gray-50 text-text-secondary hover:bg-red-50 hover:text-red-500'
            }`}
        >
          {hovered
            ? <><UserMinus size={13} /> সরিয়ে দিন</>
            : <><UserCheck size={13} /> বন্ধু আছেন</>
          }
        </button>
      </div>
    </div>
  );
};

/* ── Request Card (list row) ─────────────────────────────────── */
const RequestCard = ({ request }) => {
  const dispatch   = useDispatch();
  const { action } = useSelector(selectFriendLoading);

  return (
    <div className="bg-card rounded-card shadow-card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
      {/* Avatar */}
      <Link to={`/app/user/${request._id}`} className="shrink-0">
        <img
          src={request.profilePicture || '/avatar.png'}
          alt={request.name}
          onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/10 hover:ring-primary/30 transition-all"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/app/user/${request._id}`}
          className="font-semibold text-text-main hover:text-primary transition-colors text-sm block truncate"
        >
          {request.name}
        </Link>
        <p className="text-xs text-text-light truncate">@{request.username}</p>
        {request.bio && (
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
            {request.bio}
          </p>
        )}
        <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
          <Clock size={11} /> ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => dispatch(acceptFriendRequest(request.requestId))}
          disabled={action}
          className="flex items-center gap-1.5 text-xs font-medium bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={13} /> অ্যাক্সেপ্ট
        </button>
        <button
          onClick={() => dispatch(rejectFriendRequest(request.requestId))}
          disabled={action}
          className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 text-text-secondary hover:bg-red-50 hover:text-red-500 px-4 py-2 rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X size={13} /> রিজেক্ট
        </button>
      </div>
    </div>
  );
};

/* ── Empty State ─────────────────────────────────────────────── */
const EmptyFriends = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <Users size={26} className="text-primary/40" />
    </div>
    <p className="font-semibold text-text-secondary">এখনো কোনো বন্ধু নেই</p>
    <Link
      to="/app/friends/suggestions"
      className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
    >
      <UserPlus size={14} /> নতুন বন্ধু যুক্ত করুন
    </Link>
  </div>
);

/* ── Section Header ──────────────────────────────────────────── */
const SectionHeader = ({ title, count, accent }) => (
  <div className="flex items-center gap-3 mb-4">
    <h2 className="font-heading font-bold text-text-main text-base">{title}</h2>
    {count > 0 && (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accent}`}>
        {count}
      </span>
    )}
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

/* ── Main Component ──────────────────────────────────────────── */
export default function ProfileFriends() {
  const dispatch = useDispatch();
  const friends  = useSelector(selectFriends);
  const requests = useSelector(selectRequests);
  const { friends: loadingFriends, requests: loadingRequests } =
    useSelector(selectFriendLoading);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchRequests());
  }, [dispatch]);

  const validFriends  = friends.filter((f) => f && f._id);
  const validRequests = requests.filter((r) => r && r.requestId);

  return (
    <div className="space-y-8 pb-8">

      {/* ── Pending Requests Section ───────────────────────────── */}
      {(loadingRequests || validRequests.length > 0) && (
        <section>
          <SectionHeader
            title="ফ্রেন্ড রিকোয়েস্ট"
            count={validRequests.length}
            accent="bg-amber-100 text-amber-700"
          />

          <div className="space-y-3">
            {loadingRequests && (
              <>
                <SkeletonRequestCard />
                <SkeletonRequestCard />
              </>
            )}
            {!loadingRequests && validRequests.map((r) => (
              <RequestCard key={r.requestId} request={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── Friends Grid Section ───────────────────────────────── */}
      <section>
        <SectionHeader
          title="বন্ধুরা"
          count={validFriends.length}
          accent="bg-primary/10 text-primary"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {loadingFriends && (
            <>
              {[1, 2, 3, 4].map((i) => <SkeletonFriendCard key={i} />)}
            </>
          )}

          {!loadingFriends && validFriends.length === 0 && <EmptyFriends />}

          {!loadingFriends && validFriends.map((friend) => (
            <FriendCard key={friend._id} friend={friend} />
          ))}
        </div>

        {/* Footer link */}
        {validFriends.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              to="/app/friends/suggestions"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              <UserPlus size={14} /> আরো বন্ধু যুক্ত করুন
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}