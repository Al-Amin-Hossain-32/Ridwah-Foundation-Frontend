import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { selectUser } from "@/app/store/authSlice";
import { fetchGlobalFeed, selectFeed, selectFeedLoading } from "@/app/store/postSlice";
import PostCard from "../../../modules/social/posts/PostCard";
import postService from "@/services/post.service";

/**
 * ProfilePosts
 *
 * আগের সমস্যা: local useState দিয়ে posts রাখা হচ্ছিল।
 * Socket event Redux-এ যাচ্ছিল কিন্তু local state আপডেট হচ্ছিল না।
 *
 * এখন:
 * - Initial load: API থেকে নিজের posts আনা হয় এবং Redux-এ merge হয়
 * - Display: Redux selectFeed থেকে নিজের posts filter করে দেখানো হয়
 * - Socket event Redux আপডেট করলে এই component automatically re-render হয়
 */
export default function ProfilePosts() {
  const dispatch = useAppDispatch();
  const user     = useAppSelector(selectUser);

  // Redux থেকে সব posts নিয়ে নিজের posts filter করা
  // Socket event এলে Redux আপডেট হবে → এই component re-render হবে
  const allPosts = useAppSelector(selectFeed);
  const myPosts  = allPosts.filter(
    (p) => p.author?._id?.toString() === user?._id?.toString()
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);

  // Initial load — API থেকে নিজের posts আনো
  // fetchGlobalFeed এ merge হবে, তারপর filter করে দেখাবে
  useEffect(() => {
    if (!user?._id) return;

    setInitialLoading(true);
    postService
      .userPosts(user._id, 1)
      .then((res) => {
        const fetched = res.data.posts || [];
        setHasMore(res.data.pagination?.page < res.data.pagination?.pages);
        setPage(1);

        // Redux-এ dispatch করি যাতে socket events কাজ করে
        // fetchGlobalFeed না করে directly dispatch করা হচ্ছে
        // postSlice এর fetchGlobalFeed.fulfilled এ merge হবে
        dispatch({
          type: 'posts/fetchGlobalFeed/fulfilled',
          payload: { posts: fetched, page: 1, totalPages: res.data.pagination?.pages || 1 },
        });
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false));
  }, [user?._id, dispatch]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !user?._id) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res      = await postService.userPosts(user._id, nextPage);
      const fetched  = res.data.posts || [];

      // Redux-এ merge করো
      dispatch({
        type: 'posts/fetchGlobalFeed/fulfilled',
        payload: { posts: fetched, page: nextPage, totalPages: res.data.pagination?.pages || 1 },
      });

      setPage(nextPage);
      setHasMore(nextPage < (res.data.pagination?.pages || 1));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, user?._id, dispatch]);

  if (initialLoading) return <ProfileSkeleton />;

  if (myPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl px-md bg-card rounded-card border border-dashed border-text-light/30">
        <div className="text-4xl mb-sm">📝</div>
        <p className="text-h3 text-text-secondary font-heading">আপনার কোনো পোস্ট নেই</p>
        <p className="text-small text-text-light">নতুন কিছু শেয়ার করুন আপনার বন্ধুদের সাথে!</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-md pb-xl">
      <div className="px-sm flex justify-between items-center">
        <h2 className="text-h2 text-text-main font-heading">আমার পোস্টসমূহ</h2>
        <span className="bg-primary-50 text-primary text-small px-sm py-xs rounded-full font-bold">
          {myPosts.length} টি পোস্ট
        </span>
      </div>

      <div className="space-y-lg">
        {myPosts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-sm">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-small font-bold text-primary hover:bg-primary/5 px-md py-sm rounded-full transition-all flex items-center gap-xs disabled:opacity-50"
          >
            {loadingMore ? "লোড হচ্ছে..." : "আরো পোস্ট দেখুন"}
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-md animate-pulse p-md">
      {[1, 2].map((i) => (
        <div key={i} className="h-64 bg-gray-100 rounded-card w-full" />
      ))}
    </div>
  );
}