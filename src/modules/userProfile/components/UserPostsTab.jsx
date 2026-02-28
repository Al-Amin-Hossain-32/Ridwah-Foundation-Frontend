import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Loader2 } from 'lucide-react';
import { selectFeed } from '@/app/store/postSlice';
import PostCard from '@/modules/social/posts/PostCard';
import postService from '@/services/post.service';

const PostSkeleton = () => (
  <div className="bg-card rounded-card shadow-card p-4 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-200" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3.5 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-1/6" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3.5 bg-gray-200 rounded w-full" />
      <div className="h-3.5 bg-gray-100 rounded w-5/6" />
    </div>
  </div>
);

const UserPostsTab = ({ userId }) => {
  const dispatch = useDispatch();

  // Redux shared posts array থেকে এই user-এর posts filter করা
  // Socket event এলে postSlice update হবে → এখানে automatically reflect হবে
  const allPosts = useSelector(selectFeed);
  const posts    = allPosts.filter(
    (p) => p.author?._id?.toString() === userId?.toString()
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);
  const [total,          setTotal]          = useState(0);
  const [loadingMore,    setLoadingMore]    = useState(false);

  useEffect(() => {
    if (!userId) return;
    setInitialLoading(true);

    postService.userPosts(userId, 1)
      .then((res) => {
        const fetched    = res.data.posts || [];
        const pagination = res.data.pagination || {};
        setTotal(pagination.total || fetched.length);
        setHasMore(pagination.page < pagination.pages);
        setPage(1);

        // shared postSlice-এ merge করি — socket events কাজ করার জন্য
        dispatch({
          type: 'posts/fetchGlobalFeed/fulfilled',
          payload: { posts: fetched, page: 1, totalPages: pagination.pages || 1 },
        });
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false));
  }, [userId, dispatch]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !userId) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    postService.userPosts(userId, nextPage)
      .then((res) => {
        const fetched    = res.data.posts || [];
        const pagination = res.data.pagination || {};
        setPage(nextPage);
        setHasMore(nextPage < (pagination.pages || 1));

        dispatch({
          type: 'posts/fetchGlobalFeed/fulfilled',
          payload: { posts: fetched, page: nextPage, totalPages: pagination.pages || 1 },
        });
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, userId, dispatch]);

  if (initialLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <FileText size={24} className="text-primary/50" />
        </div>
        <p className="font-medium text-text-secondary">এখনো কোনো পোস্ট নেই</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => <PostCard key={post._id} post={post} />)}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-2.5 rounded-card bg-card shadow-card text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {loadingMore
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> লোড হচ্ছে...</span>
            : `আরো দেখুন (${total - posts.length} টি বাকি)`}
        </button>
      )}
    </div>
  );
};

export default UserPostsTab;