import { useState, memo } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { deletePost } from "@/app/store/postSlice";
import { selectUser } from "@/app/store/authSlice";
import { Avatar } from "@/components/ui/Avatar";
import ReactionButton, { ReactionSummary } from "./ReactionButton";
import CommentSection from "./CommentSection";
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit2,
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

/**
 * PostCard (Updated)
 *
 * Changes:
 * 1. Like button → ReactionButton (Facebook-style picker)
 * 2. Comment section extracted to CommentSection component
 * 3. deletePost dispatched directly
 * 4. memo() for feed performance
 */
const PostCard = memo(({ post }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);

  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = post.author?._id === currentUser?._id;

  const handleDelete = async () => {
    if (!window.confirm("এই পোস্টটি মুছে ফেলবেন?")) return;
    setShowMenu(false);
    const result = await dispatch(deletePost(post._id));
    if (deletePost.fulfilled.match(result)) {
      toast.success("পোস্ট মুছে ফেলা হয়েছে");
    } else {
      toast.error("মুছতে পারা যায়নি");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    if (navigator.share) {
      navigator.share({ title: "Post by " + post.author?.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("লিঙ্ক কপি হয়েছে!");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible mb-5 transition-shadow hover:shadow-md">
      {/* ── Header ── */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/app/user/${post.author?._id}`}
            className="font-medium text-text-main hover:text-primary transition-colors block truncate"
          >
            <Avatar
              src={post.author?.profilePicture}
              name={post.author?.name}
              className="w-10 h-10 border border-gray-50"
            />
          </Link>
          <div>
            <Link
              to={`/app/user/${post.author?._id}`}
              className="font-medium text-text-main hover:text-primary transition-colors block truncate"
            >
              <h4 className="text-sm font-bold text-gray-900 leading-tight">
                {post.author?.name}
              </h4>{" "}
            </Link>
            <p className="text-[11px] text-gray-400">
              {moment(post.createdAt).fromNow()}
            </p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-all"
          >
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-xl border border-gray-100 py-1 z-50 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false); /* open edit modal */
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 size={14} /> এডিট করুন
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} /> মুছুন
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Share2 size={14} /> শেয়ার করুন
              </button>
            </div>
          )}
          {/* Overlay to close menu */}
          {showMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-3">
        <p className="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* ── Images ── */}
      {post.images?.length > 0 && (
        <div className="border-y border-gray-50">
          {post.images.length === 1 ? (
            <img
              src={post.images[0]}
              alt=""
              className="w-full max-h-[500px] object-cover bg-gray-50"
            />
          ) : (
            <div
              className={`grid gap-0.5 ${post.images.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}
            >
              {post.images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {i === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        +{post.images.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stats Bar ── */}
      {(post.totalReactions > 0 || post.comments?.length > 0) && (
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ReactionSummary
              counts={post.reactionCounts}
              total={post.totalReactions}
              targetType="post"
              targetId={post._id}
            />
          </div>
          {post.comments?.length > 0 && (
            <button
              onClick={() => setShowComments((v) => !v)}
              className="text-xs text-gray-500 hover:underline"
            >
              {post.comments.length}টি কমেন্ট
            </button>
          )}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="p-1 mx-2 flex items-center gap-0.5 border-t border-gray-50">
        {/* Reaction button (hover for picker, click for quick like) */}
        <div className="flex-1 flex justify-center">
          <ReactionButton
            targetType="post"
            targetId={post._id}
            postId={post._id}
            userReaction={post.userReaction}
            totalReactions={post.totalReactions}
            reactionCounts={post.reactionCounts}
            size="md"
          />
        </div>

        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-sm font-bold ${
            showComments
              ? "text-primary bg-primary/5"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <MessageCircle size={20} />
          কমেন্ট
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all text-sm font-bold"
        >
          <Share2 size={19} />
          শেয়ার
        </button>
      </div>

      {/* ── Comment Section ── */}
      <CommentSection
        post={post}
        currentUser={currentUser}
        visible={showComments}
      />
    </div>
  );
});

PostCard.displayName = "PostCard";
export default PostCard;
