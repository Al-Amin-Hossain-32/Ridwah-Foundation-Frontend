import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Loader2 } from 'lucide-react';
import { fetchUserPosts, selectProfilePosts } from '../userProfileSlice';

/* ── PostCard — simple read-only post display ────────────────── */
const PostCard = ({ post }) => (
  <div className="bg-card rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow">
    {/* Author row */}
    <div className="flex items-center gap-3 mb-3">
      <img
        src={post.author?.profilePicture || '/avatar.png'}
        alt={post.author?.name}
        onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
        className="w-9 h-9 rounded-full object-cover"
      />
      <div>
        <p className="text-sm font-medium text-text-main">{post.author?.name}</p>
        <p className="text-xs text-text-light">
          {new Date(post.createdAt).toLocaleDateString('bn-BD', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>
    </div>

    {/* Content */}
    {post.content && (
      <p className="text-body text-text-main whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>
    )}

    {/* Images */}
    {post.images?.length > 0 && (
      <div className={`mt-3 grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {post.images.slice(0, 4).map((img, i) => (
          <div key={i} className="relative">
            <img
              src={img}
              alt={`post-${i}`}
              className="w-full rounded-lg object-cover max-h-64"
            />
            {/* More overlay */}
            {i === 3 && post.images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">+{post.images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Reactions summary */}
    {(post.likesCount > 0 || post.commentsCount > 0) && (
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-text-light">
        {post.likesCount > 0 && <span>👍 {post.likesCount}</span>}
        {post.commentsCount > 0 && <span>💬 {post.commentsCount} মন্তব্য</span>}
      </div>
    )}
  </div>
);

/* ── Skeleton ─────────────────────────────────────────────────── */
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

/* ── Main Tab ─────────────────────────────────────────────────── */
const UserPostsTab = ({ userId }) => {
  const dispatch = useDispatch();
  const { posts, hasMore, page, total, loading } = useSelector(selectProfilePosts);

  useEffect(() => {
    if (userId) dispatch(fetchUserPosts({ userId, page: 1 }));
  }, [userId, dispatch]);

  const loadMore = () => {
    if (hasMore && !loading) dispatch(fetchUserPosts({ userId, page: page + 1 }));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (!loading && posts.length === 0) {
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

      {/* Load more */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2.5 rounded-card bg-card shadow-card text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> লোড হচ্ছে...</span>
            : `আরো দেখুন (${total - posts.length} টি বাকি)`}
        </button>
      )}
    </div>
  );
};

export default UserPostsTab;