import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { fetchTimeline, selectTimeline } from "@/app/store/postSlice";
import { selectUser } from "@/app/store/authSlice";
import PostCard from "./PostCard"; // নতুন সাব-কম্পোনেন্ট

export default function ProfilePosts() {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(selectTimeline);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    // শুধুমাত্র প্রোফাইল পোস্টের জন্য আলাদা API থাকলে ভালো, 
    // নয়তো টাইমলাইন থেকে ফিল্টার করাও চলে।
    dispatch(fetchTimeline());
  }, [dispatch]);

  // Performance Optimization: অপ্রয়োজনীয় রেন্ডার রুখতে useMemo ব্যবহার
  const myPosts = useMemo(() => {
    return posts.filter((p) => p.author?._id === user?._id);
  }, [posts, user?._id]);

  if (!user) return <ProfileSkeleton />;

  if (myPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl px-md bg-card rounded-card border border-dashed border-text-light/30">
        <div className="text-4xl mb-sm">📝</div>
        <p className="text-h3 text-text-secondary font-heading">আপনার কোনো পোস্ট নেই</p>
        <p className="text-small text-text-light">নতুন কিছু শেয়ার করুন আপনার বন্ধুদের সাথে!</p>
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
          <PostCard key={post._id} post={post} currentUser={user} />
        ))}
      </div>
    </div>
  );
}

// সিম্পল লোডিং স্কেলিটন
function ProfileSkeleton() {
  return (
    <div className="space-y-md  animate-pulse p-md">
      {[1, 2].map((i) => (
        <div key={i} className="h-64 bg-gray-100 rounded-card w-full" />
      ))}
    </div>
  );
}