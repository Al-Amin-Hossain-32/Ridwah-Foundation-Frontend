import { Link } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { sendFriendRequest } from '../friend.thunks';
import { selectFriendLoading } from '../friendSlice';

const SuggestionCard = ({ user }) => {
  const dispatch   = useDispatch();
  const { action } = useSelector(selectFriendLoading);

  return (
    <div className="bg-card shadow-card rounded-card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={user.profilePicture || '/avatar.png'}
          alt={user.name}
          onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10 shrink-0"
        />
        <div className="min-w-0">
          <Link
            to={`/app/user/${user._id}`}
            className="font-medium text-text-main hover:text-primary transition-colors block truncate"
          >
            {user.name}
          </Link>
          <p className="text-sm text-text-secondary truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-xs text-text-light mt-0.5 truncate">{user.bio}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => dispatch(sendFriendRequest(user._id))}
        disabled={action}
        className="ml-3 shrink-0 inline-flex items-center gap-1.5 text-sm bg-primary text-white hover:bg-primary-dark px-3 py-1.5 rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {action
          ? <Loader2 size={13} className="animate-spin" />
          : <UserPlus size={13} />}
        বন্ধু করুন
      </button>
    </div>
  );
};

export default SuggestionCard;