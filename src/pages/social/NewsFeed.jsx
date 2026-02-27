import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { 
  fetchGlobalFeed, 
  resetPosts, 
  selectTimeline, 
  selectPostLoading, 
  selectHasMore, 
  selectPage 
} from '@/app/store/postSlice';
import { selectUser } from '@/app/store/authSlice';
import PostCard from '../profile/submenu/PostCard'; // আপনার পাথ অনুযায়ী ঠিক করে নিন
import CreatePost from './CreatePost'; // একই ফোল্ডারে থাকলে
import { CardSkeleton } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshCw, Loader2 } from 'lucide-react';

const NewsFeed = () => {
  const dispatch = useAppDispatch();
  
  // রিডাক্স স্টেট থেকে ডাটা আনা
  const posts = useAppSelector(selectTimeline);
  const loading = useAppSelector(selectPostLoading);
  const hasMore = useAppSelector(selectHasMore);
  const page = useAppSelector(selectPage);
  const currentUser = useAppSelector(selectUser);

  // প্রথমবার লোড হওয়ার সময় গ্লোবাল ফিড আনা
  useEffect(() => {
    dispatch(resetPosts());
    dispatch(fetchGlobalFeed({ page: 1 }));
  }, [dispatch]);

  // আরো পোস্ট লোড করার ফাংশন
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchGlobalFeed({ page: page + 1 }));
    }
  };

  return (
    <div className="max-w-[600px] mx-auto py-md px-sm md:px-0">
      
      {/* ১. পোস্ট তৈরি করার বার (আপনার দেওয়া CreatePost) */}
      <CreatePost />

      {/* ২. ফিড হেডার */}
      <div className="flex items-center justify-between mb-md px-xs">
        <h2 className="text-body font-bold text-text-main">সর্বশেষ পোস্টসমূহ</h2>
        <button 
          onClick={() => {
            dispatch(resetPosts());
            dispatch(fetchGlobalFeed({ page: 1 }));
          }}
          disabled={loading}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-all"
        >
          <RefreshCw size={18} className={`${loading ? 'animate-spin text-primary' : 'text-text-light'}`} />
        </button>
      </div>

      {/* ৩. পোস্ট লিস্ট রেন্ডারিং */}
      <div className="flex flex-col">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              currentUser={currentUser} 
            />
          ))
        ) : !loading && (
          <EmptyState 
            title="কোনো পোস্ট পাওয়া যায়নি" 
            subtitle="নতুন বন্ধু তৈরি করুন অথবা নিজে কিছু পোস্ট করুন!" 
          />
        )}

        {/* ৪. লোডিং স্কেলিটন বা লোডার */}
        {loading && (
          <div className="space-y-md">
            {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
          </div>
        )}
      </div>

      {/* ৫. ইনফিনিট স্ক্রল / লোড মোর বাটন */}
      {!loading && hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-lg mb-xl">
          <button 
            onClick={handleLoadMore}
            className="text-small font-bold text-primary hover:bg-primary/5 px-md py-sm rounded-full transition-all flex items-center gap-xs"
          >
            আরো পোস্ট দেখুন
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-text-light py-lg">
          আপনি সব পোস্ট দেখে ফেলেছেন 🎉
        </p>
      )}
    </div>
  );
};

export default NewsFeed;