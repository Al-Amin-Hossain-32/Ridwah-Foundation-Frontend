import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles } from 'lucide-react';
import { fetchSuggestions } from '../friend.thunks';
import { selectSuggestions, selectFriendLoading } from '../friendSlice';
import SuggestionCard from '../components/SuggestionCard';
import FriendTabs    from '../components/FriendTabs';
import SkeletonCard   from '../components/SkeletonCard';
import EmptyState     from '../components/EmptyState';

const SuggestionsPage = () => {
  const dispatch   = useDispatch();
  const suggestions = useSelector(selectSuggestions);
  const { suggestions: isLoading } = useSelector(selectFriendLoading);

  useEffect(() => { dispatch(fetchSuggestions()); }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg p-4 max-w-2xl mx-auto">
      <h1 className="text-h2 font-heading text-text-main mb-4">বন্ধু সাজেশন</h1>

      <FriendTabs />

      <div className="space-y-3">
        {isLoading && <SkeletonCard count={4} />}

        {!isLoading && suggestions.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="কোনো সাজেশন নেই"
            subtitle="নেটওয়ার্ক বড় হলে নতুন সাজেশন দেখাবে"
          />
        )}

        {!isLoading && suggestions.map((u) => <SuggestionCard key={u._id} user={u} />)}
      </div>
    </div>
  );
};

export default SuggestionsPage;