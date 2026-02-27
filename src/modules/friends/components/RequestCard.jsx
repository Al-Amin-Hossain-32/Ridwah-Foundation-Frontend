import { Link } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { acceptFriendRequest, rejectFriendRequest } from '../friend.thunks';
import { selectFriendLoading } from '../friendSlice';

/**
 * RequestCard
 * request.requestId === friendship._id (backend flat response থেকে আসে)
 */
const RequestCard = ({ request }) => {
  const dispatch   = useDispatch();
  const { action } = useSelector(selectFriendLoading);

  return (
    <div className="bg-card shadow-card rounded-card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={request.profilePicture || '/avatar.png'}
          alt={request.name}
          onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10 shrink-0"
        />
        <div className="min-w-0">
          <Link
            to={`/app/user/${request._id}`}
            className="font-medium text-text-main hover:text-primary transition-colors block truncate"
          >
            {request.name}
          </Link>
          <p className="text-sm text-text-secondary truncate">@{request.username}</p>
          {request.bio && (
            <p className="text-xs text-text-light mt-0.5 truncate">{request.bio}</p>
          )}
        </div>
      </div>

      <div className="ml-3 shrink-0 flex gap-2">
        <button
          onClick={() => dispatch(acceptFriendRequest(request.requestId))}
          disabled={action}
          className="inline-flex items-center gap-1.5 text-sm bg-primary text-white hover:bg-primary-dark px-3 py-1.5 rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          অ্যাক্সেপ্ট
        </button>
        <button
          onClick={() => dispatch(rejectFriendRequest(request.requestId))}
          disabled={action}
          className="inline-flex items-center gap-1.5 text-sm bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          রিজেক্ট
        </button>
      </div>
    </div>
  );
};

export default RequestCard;