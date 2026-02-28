import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchGlobalFeed,
  resetFeedPagination,
  selectFeed,
  selectFeedLoading,
  selectFeedHasMore,
  selectFeedPage,
} from "@/app/store/postSlice";
import PostCard   from "@/modules/social/posts/PostCard";
import CreatePost from "./CreatePost";
import { CardSkeleton } from "@/components/ui/Loader";
import { EmptyState }   from "@/components/ui/EmptyState";
import { RefreshCw }    from "lucide-react";

const NewsFeed = () => {
  const dispatch = useAppDispatch();
  const posts   = useAppSelector(selectFeed);
  const loading = useAppSelector(selectFeedLoading);
  const hasMore = useAppSelector(selectFeedHasMore);
  const page    = useAppSelector(selectFeedPage);

  useEffect(() => {
    // posts array reset করা হচ্ছে না
    // শুধু pagination reset করে page 1 fetch করা হচ্ছে
    dispatch(resetFeedPagination());
    dispatch(fetchGlobalFeed({ page: 1 }));
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(resetFeedPagination());
    dispatch(fetchGlobalFeed({ page: 1 }));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchGlobalFeed({ page: page + 1 }));
    }
  }, [loading, hasMore, page, dispatch]);

  return (
    <div className="max-w-[600px] mx-auto py-md px-sm md:px-0">
      <CreatePost />

      <div className="flex items-center justify-between mb-md px-xs">
        <h2 className="text-body font-bold text-text-main">সর্বশেষ পোস্টসমূহ</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-all"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-primary" : "text-text-light"} />
        </button>
      </div>

      <div className="flex flex-col">
        {posts.length > 0
          ? posts.map((post) => <PostCard key={post._id} post={post} />)
          : !loading && (
              <EmptyState
                title="কোনো পোস্ট পাওয়া যায়নি"
                subtitle="নতুন বন্ধু তৈরি করুন অথবা নিজে কিছু পোস্ট করুন!"
              />
            )}
        {loading && (
          <div className="space-y-md">
            {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
          </div>
        )}
      </div>

      {!loading && hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-lg mb-xl">
          <button onClick={handleLoadMore} className="text-small font-bold text-primary hover:bg-primary/5 px-md py-sm rounded-full transition-all">
            আরো পোস্ট দেখুন
          </button>
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-text-light py-lg">আপনি সব পোস্ট দেখে ফেলেছেন 🎉</p>
      )}
    </div>
  );
};

export default NewsFeed;