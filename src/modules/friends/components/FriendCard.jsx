import { Link } from 'react-router-dom';
import { UserMinus, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFriend } from '../friend.thunks';
import { selectFriendLoading } from '../friendSlice';

const FriendCard = ({ friend }) => {
  const dispatch   = useDispatch();
  const { action } = useSelector(selectFriendLoading);

  return (
    <div className="bg-card shadow-card rounded-card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={friend.profilePicture || '/avatar.png'}
          alt={friend.name}
          onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10 shrink-0"
        />
        <div className="min-w-0">
          <Link
            to={`/app/user/${friend._id}`}
            className="font-medium text-text-main hover:text-primary transition-colors block truncate"
          >
            {friend.name}
          </Link>
          <p className="text-sm text-text-secondary truncate">@{friend.username}</p>
          {friend.bio && (
            <p className="text-xs text-text-light mt-0.5 truncate">{friend.bio}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => dispatch(removeFriend(friend._id))}
        disabled={action}
        className="ml-3 shrink-0 inline-flex items-center gap-1.5 text-sm bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {action
          ? <Loader2 size={13} className="animate-spin" />
          : <UserMinus size={13} />}
        সরান
      </button>
    </div>
  );
};

export default FriendCard;