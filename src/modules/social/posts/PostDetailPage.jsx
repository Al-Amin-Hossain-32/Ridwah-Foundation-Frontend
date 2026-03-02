import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { selectFeed } from '@/app/store/postSlice';
import PostCard from '@/modules/social/posts/PostCard';
import { ArrowLeft } from 'lucide-react';
import postService from '@/services/post.service';
// import PostDetailSkeleton from './PostDetailSkeleton';

export default function PostDetailPage() {
  const { postId }  = useParams();
  const navigate    = useNavigate();
  const allPosts    = useAppSelector(selectFeed);
  const reduxPost   = allPosts.find((p) => p._id === postId);

  const [post,    setPost]    = useState(reduxPost || null);
  const [loading, setLoading] = useState(!reduxPost);

  // Redux-এ update হলে sync
  useEffect(() => {
    if (reduxPost) setPost(reduxPost);
  }, [reduxPost]);

  // Redux-এ না থাকলে API থেকে আনো
  useEffect(() => {
    if (reduxPost) return;
    setLoading(true);
    postService.getById(postId)
      .then((res) => setPost(res.data.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900 text-sm">পোস্ট</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading && <PageSkeleton />}
        {!loading && post && <PostCard post={post} />}
        {!loading && !post && (
          <p className="text-center text-gray-400 py-10">পোস্ট পাওয়া যায়নি</p>
        )}
      </div>
    </div>
  );
}
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14" />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 animate-pulse">
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-200" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-4/5" />
          </div>
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}