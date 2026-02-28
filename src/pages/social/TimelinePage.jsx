import { useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchTimeline,
  selectTimelinePosts,
  selectTimelineLoading,
} from '@/app/store/postSlice';
import { CardSkeleton } from '@/components/ui/Loader';
import { EmptyState }   from '@/components/ui/EmptyState';
import PostCard   from '@/modules/social/posts/PostCard';
import CreatePost from './CreatePost';

export default function TimelinePage() {
  const dispatch = useAppDispatch();

  // selectTimelinePosts: posts array থেকে timelineAuthorIds দিয়ে filter করা
  // socket event posts array update করলে এই selector automatically নতুন value দেবে
  const posts   = useAppSelector(selectTimelinePosts);
  const loading = useAppSelector(selectTimelineLoading);

  useEffect(() => {
    // reset নেই — posts array shared, reset করলে NewsFeed-এর data যাবে
    // শুধু timeline authors fetch করা হচ্ছে
    dispatch(fetchTimeline());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchTimeline());
  }, [dispatch]);

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-lg">
        <h2 className="font-heading text-text-main">Community</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-xs bg-primary text-white rounded-btn px-3 py-2 text-small font-medium transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      <CreatePost />

      {loading ? (
        <div className="space-y-md">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-md">
          {posts.map((p) => <PostCard key={p._id} post={p} />)}
        </div>
      ) : (
        <EmptyState icon="✍️" title="Timeline খালি" description="প্রথম post করুন!" />
      )}
    </div>
  );
}