import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import { fetchRequests } from '../friend.thunks.js';
import { selectRequests, selectFriendLoading } from '../friendSlice.js';
import RequestCard  from '../components/RequestCard.jsx';
import FriendTabs  from '../components/FriendTabs.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import EmptyState   from '../components/EmptyState.jsx';

const RequestsPage = () => {
  const dispatch   = useDispatch();
  const requests   = useSelector(selectRequests);
  const { requests: isLoading } = useSelector(selectFriendLoading);

  useEffect(() => { dispatch(fetchRequests()); }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg p-4 max-w-2xl mx-auto">
      <h1 className="text-h2 font-heading text-text-main mb-4 flex items-center gap-2">
        ফ্রেন্ড রিকোয়েস্ট
        {requests.length > 0 && (
          <span className="bg-error text-white text-sm font-bold rounded-full px-2 py-0.5 leading-none">
            {requests.length}
          </span>
        )}
      </h1>

      <FriendTabs />

      <div className="space-y-3">
        {isLoading && <SkeletonCard count={3} />}

        {!isLoading && requests.length === 0 && (
          <EmptyState
            icon={Bell}
            title="কোনো পেন্ডিং রিকোয়েস্ট নেই"
            subtitle="নতুন রিকোয়েস্ট এলে এখানে দেখাবে"
          />
        )}

        {!isLoading && requests.map((r) => <RequestCard key={r.requestId} request={r} />)}
      </div>
    </div>
  );
};

export default RequestsPage;