import { useState, useMemo } from "react";
import { useAppDispatch } from "@/hooks/useRedux";
import { updateLikeRealtime, likePost, addComment } from "@/app/store/postSlice";
import { Avatar } from "@/components/ui/Avatar";
import { Heart, MessageCircle, Send, ChevronDown, ChevronUp, Share2, MoreHorizontal, Trash2 } from "lucide-react";
import moment from "moment";

export default function PostCard({ post, currentUser }) {
  const dispatch = useAppDispatch();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const DEFAULT_PIC = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4c-PH1EGE9lnEJST7gibwmdGVa3diQ8Nhkw&s";

  // ১. আপনার সেই কাজ করা লাইক চেক লজিক
  const isLiked = useMemo(() => {
    return post?.likes?.some(liker => {
      const id = typeof liker === 'object' ? liker?._id : liker;
      return id === currentUser?._id;
    });
  }, [post?.likes, currentUser?._id]);

  // ২. ইনস্ট্যান্ট লাইক আপডেট
  const handleLike = () => {
    if (!currentUser?._id) return;
    dispatch(updateLikeRealtime({ postId: post._id, currentUser }));
    dispatch(likePost({ postId: post._id }));
  };

  // ৩. ইনস্ট্যান্ট কমেন্ট আপডেট (Optimistic)
  const onCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;

    // সার্ভারে যাওয়ার আগেই রিডাক্স স্টেটে পুশ করা
    dispatch(addComment({ 
      postId: post._id, 
      text: comment,
      optimistic: true, // স্লাইসে এই ফ্ল্যাগটি হ্যান্ডেল করতে হবে
      currentUser 
    }));
    
    setComment("");
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    if (navigator.share) {
      navigator.share({ title: 'Post by ' + post.author?.name, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("লিঙ্ক কপি হয়েছে!");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5 transition-all hover:shadow-md">
      
      {/* --- Header --- */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={post.author?.profilePicture} name={post.author?.name} className="w-10 h-10 border border-gray-50" />
          <div>
            <h4 className="text-sm font-bold text-gray-900 leading-tight">{post.author?.name}</h4>
            <p className="text-[11px] text-gray-500">{moment(post.createdAt).fromNow()}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* --- Content --- */}
      <div className="px-4 pb-2">
        <p className="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* --- Image Display --- */}
      {post.images && post.images.length > 0 && (
        <div className="mt-2 border-y border-gray-50">
          <img 
            src={post.images[0]} 
            alt="Post Content" 
            className="w-full max-h-[500px] object-cover bg-gray-50" 
          />
        </div>
      )}

      {/* --- Stats --- */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {post.likes?.slice(0, 3).map((liker, i) => (
              <img 
                key={i} 
                src={(typeof liker === 'object' ? liker.profilePicture : null) || DEFAULT_PIC} 
                className="w-4 h-4 rounded-full border border-white" 
              />
            ))}
          </div>
          <span className="text-[12px] text-gray-500 font-medium">
            {post.likes?.length || 0} জন লাইক দিয়েছেন
          </span>
        </div>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="text-[12px] text-gray-500 hover:underline"
        >
          {post.comments?.length || 0} কমেন্ট
        </button>
      </div>

      {/* --- Actions --- */}
      <div className="p-2 mt-1 flex items-center gap-1 border-t border-gray-50">
        <button 
          onClick={handleLike} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${isLiked ? "text-red-500 bg-red-50" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-sm font-bold">লাইক</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${showComments ? "text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <MessageCircle size={20} />
          <span className="text-sm font-bold">কমেন্ট</span>
        </button>

        <button 
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
        >
          <Share2 size={19} />
          <span className="text-sm font-bold">শেয়ার</span>
        </button>
      </div>

      {/* --- Comments Section --- */}
      {showComments && (
        <div className="px-4 pb-4 bg-gray-50/50 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-4 pt-4 max-h-72 overflow-y-auto custom-scrollbar">
            {post.comments?.map((c, idx) => (
              <div key={c._id || idx} className="flex gap-2.5 items-start">
                <Avatar src={c.user?.profilePicture} name={c.user?.name} className="w-8 h-8 flex-shrink-0" />
                <div className="bg-white border border-gray-100 p-2.5 rounded-2xl rounded-tl-none shadow-sm flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-bold text-[12px] text-gray-900">{c.user?.name}</p>
                    {c.user?._id === currentUser?._id && (
                       <button className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-700 leading-snug">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <form onSubmit={onCommentSubmit} className="flex gap-2 items-center mt-4">
            <Avatar src={currentUser?.profilePicture} className="w-8 h-8" />
            <div className="flex-1 flex bg-white border border-gray-200 rounded-full px-4 py-1 items-center focus-within:border-primary transition-all shadow-inner">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="কমেন্ট লিখুন..."
                className="flex-1 bg-transparent border-none py-1.5 text-sm outline-none"
              />
              <button type="submit" disabled={!comment.trim()} className="text-primary p-1 disabled:opacity-30">
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}