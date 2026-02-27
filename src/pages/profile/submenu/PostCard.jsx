import { useState, useMemo } from "react";
import { useAppDispatch } from "@/hooks/useRedux";
import { updateLikeRealtime, likePost, addComment } from "@/app/store/postSlice";
import { Avatar } from "@/components/ui/Avatar";
import { Heart, MessageCircle, Send, ChevronDown, ChevronUp, MoreHorizontal, Share2, Trash2 } from "lucide-react";

export default function PostCard({ post, currentUser }) {
  const dispatch = useAppDispatch();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  // ডিফল্ট ইমেজ যেন ক্র্যাশ না করে
  const DEFAULT_PIC = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4c-PH1EGE9lnEJST7gibwmdGVa3diQ8Nhkw&s";

  // লাইক চেক লজিক (নিরাপদ উপায়ে)
  const isLiked = useMemo(() => {
    return post?.likes?.some(liker => {
      const id = typeof liker === 'object' ? liker?._id : liker;
      return id === currentUser?._id;
    });
  }, [post?.likes, currentUser?._id]);

  const handleLike = () => {
    if (!currentUser?._id) return;
    dispatch(updateLikeRealtime({ postId: post._id, currentUser }));
    dispatch(likePost({ postId: post._id }));
  };

  const onCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    dispatch(addComment({ postId: post._id, text: comment }));
    setComment("");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Post', text: post.content, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("লিঙ্ক কপি হয়েছে!");
    }
  };

  return (
    <div className="bg-card rounded-card shadow-sm border border-gray-100 overflow-hidden mb-md transition-all hover:shadow-md">
      
      {/* --- Post Header --- */}
      <div className="p-md flex items-center justify-between">
        <div className="flex items-center gap-md">
          <Avatar src={post.author?.profilePicture} name={post.author?.name} className="w-10 h-10 border border-gray-100" />
          <div>
            <h4 className="text-body font-bold text-text-main leading-tight">{post.author?.name}</h4>
            <p className="text-xs text-text-light">{new Date(post.createdAt).toLocaleDateString("bn-BD")}</p>
          </div>
        </div>
        <button className="text-text-light hover:text-text-main"><MoreHorizontal size={20} /></button>
      </div>

      {/* --- Post Content --- */}
      <div className="px-md pb-sm">
        <p className="text-body text-text-main whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* --- Post Image --- */}
      {post.images?.[0] && (
        <div className="mt-xs">
          <img src={post.images[0]} alt="Post" className="w-full max-h-[450px] object-cover" />
        </div>
      )}

      {/* --- Likers Avatar Stack (Fixing the Error) --- */}
      {post.likes?.length > 0 && (
        <div className="px-md pt-sm flex items-center gap-sm">
          <div className="flex -space-x-2">
            {post.likes.slice(0, 3).map((liker, idx) => {
              if (!liker) return null; // এরর প্রতিরোধ
              const pic = typeof liker === 'object' ? liker?.profilePicture : null;
              return (
                <img 
                  key={liker?._id || idx}
                  src={pic || DEFAULT_PIC} 
                  className="w-5 h-5 rounded-full border-2 border-white object-cover bg-gray-200"
                  alt="liker"
                  onError={(e) => { e.target.src = DEFAULT_PIC; }}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-text-secondary">
            <span className="font-bold">{post.likes.length}</span> জন লাইক দিয়েছেন
          </p>
        </div>
      )}

      {/* --- Actions Section --- */}
      <div className="p-sm md:p-md border-t border-gray-50 mt-sm">
        <div className="flex items-center justify-between">
          <div className="flex gap-md md:gap-lg">
            
            {/* Like Button */}
            <button onClick={handleLike} className={`flex items-center gap-xs px-sm py-1 rounded-full transition-all ${isLiked ? "text-primary bg-primary/5" : "text-text-secondary hover:bg-gray-50"}`}>
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              <span className="font-bold text-small">{post.likes?.length || 0}</span>
            </button>
            
            {/* Comment Toggle */}
            <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-xs px-sm py-1 rounded-full transition-all ${showComments ? "text-primary bg-primary/5" : "text-text-secondary hover:bg-gray-50"}`}>
              <MessageCircle size={20} />
              <span className="font-medium text-small">{post.comments?.length || 0}</span>
              {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Share Button */}
            <button onClick={handleShare} className="flex items-center gap-xs px-sm py-1 text-text-secondary hover:bg-gray-50 rounded-full transition-all">
              <Share2 size={18} />
              <span className="font-medium text-small">শেয়ার</span>
            </button>
          </div>
        </div>

        {/* --- Comments Section --- */}
        {showComments && (
          <div className="mt-md pt-md border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-md mb-md max-h-72 overflow-y-auto pr-xs custom-scrollbar">
              {post.comments?.length > 0 ? (
                post.comments.map((c) => (
                  <div key={c._id} className="flex gap-sm items-start group">
                    <Avatar src={c.user?.profilePicture} name={c.user?.name} className="w-8 h-8 flex-shrink-0" />
                    <div className="bg-bg/60 p-sm rounded-2xl rounded-tl-none flex-1 relative group">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-bold text-xs text-text-main leading-none">{c.user?.name}</p>
                        
                        {/* ডিলিট বাটন (শুধুমাত্র নিজের বা পোস্টের মালিকের কমেন্ট হলে) */}
                        {(c.user?._id === currentUser?._id || post.author?._id === currentUser?._id) && (
                          <button className="text-text-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-small text-text-secondary">{c.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-small text-text-light text-center py-sm">কোনো কমেন্ট নেই।</p>
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={onCommentSubmit} className="flex gap-sm items-center">
              <Avatar src={currentUser?.profilePicture} name={currentUser?.name} className="w-8 h-8" />
              <div className="flex-1 flex gap-sm bg-bg rounded-full px-md py-1 items-center border border-gray-100 focus-within:border-primary/30 transition-all">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="কমেন্ট লিখুন..."
                  className="flex-1 bg-transparent border-none py-sm text-small outline-none"
                />
                <button type="submit" disabled={!comment.trim()} className="text-primary disabled:opacity-30 p-1 hover:bg-primary/10 rounded-full transition-all">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}