import { useState, useCallback, memo } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  addComment,
  deleteComment,
  addReply,
  deleteReply,
} from "@/app/store/postSlice";
import { selectUser } from "@/app/store/authSlice";
import { Avatar } from "@/components/ui/Avatar";
import ReactionButton from "./ReactionButton";
import {
  Send,
  Trash2,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

// ─── Reply Item ───────────────────────────────────────────────────────────────

const ReplyItem = memo(({ reply, postId, commentId, currentUser }) => {
  const dispatch = useAppDispatch();

  const handleDelete = () => {
    dispatch(deleteReply({ postId, commentId, replyId: reply._id }));
  };

  return (
    <div className="flex gap-2 items-start">
      <Link
        to={`/app/user/${reply.user?._id}`}
        className="font-medium text-text-main hover:text-primary transition-colors block truncate"
      >
      <Avatar
        src={reply.user?.profilePicture}
        name={reply.user?.name}
        className="w-7 h-7 flex-shrink-0"
      />
      </Link>
      <div className="flex-1">
        <div className="bg-gray-100 rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-full">
      <Link
        to={`/app/user/${reply.user?._id}`}
        className="font-medium text-text-main hover:text-primary transition-colors block truncate"
      >
          
          <p className="text-xs font-bold text-gray-900 leading-tight">
            {reply.user?.name}
          </p>
          </Link>
          <p className="text-sm text-gray-800 mt-0.5 leading-snug">
            {reply.text}
          </p>
        </div>

        {/* Reply Actions */}
        <div className="flex items-center gap-3 mt-1 ml-2">
          <ReactionButton
            targetType="reply"
            targetId={reply._id}
            postId={postId}
            userReaction={reply.userReaction}
            totalReactions={reply.totalReactions}
            reactionCounts={reply.reactionCounts}
            size="sm"
          />
          <span className="text-[10px] text-gray-400">
            {moment(reply.createdAt).fromNow()}
          </span>
          {reply.user?._id === currentUser?._id && (
            <button
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Comment Item ─────────────────────────────────────────────────────────────

const CommentItem = memo(({ comment, postId, currentUser }) => {
  const dispatch = useAppDispatch();
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const replyCount = comment.replies?.length || 0;

  const handleDeleteComment = () => {
    dispatch(deleteComment({ postId, commentId: comment._id }));
  };

  const handleReplySubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!replyText.trim()) return;
      setSubmitting(true);
      try {
        const result = await dispatch(
          addReply({ postId, commentId: comment._id, text: replyText }),
        );
        if (addReply.fulfilled.match(result)) {
          setReplyText("");
          setShowReplyInput(false);
          setShowReplies(true);
        }
      } catch (_) {
        toast.error("রিপ্লে করা যায়নি");
      }
      setSubmitting(false);
    },
    [replyText, postId, comment._id, dispatch],
  );

  return (
    <div className="flex gap-2.5 items-start">
      <Link
        to={`/app/user/${comment.user?._id}`}
        className="font-medium text-text-main hover:text-primary transition-colors block truncate"
      >
        <Avatar
          src={comment.user?.profilePicture}
          name={comment.user?.name}
          className="w-8 h-8 flex-shrink-0"
        />
      </Link>
      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-gray-100 rounded-2xl rounded-tl-none px-3.5 py-2.5 inline-block max-w-full">
          <Link
        to={`/app/user/${comment.user?._id}`}
        className="font-medium text-text-main hover:text-primary transition-colors block truncate"
      >
          <p className="text-xs font-bold text-gray-900 leading-tight">
            {comment.user?.name}
          </p>
          </Link>
          <p className="text-sm text-gray-800 mt-0.5 leading-snug break-words">
            {comment.text}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-3 mt-1 ml-1 flex-wrap">
          <ReactionButton
            targetType="comment"
            targetId={comment._id}
            postId={postId}
            userReaction={comment.userReaction}
            totalReactions={comment.totalReactions}
            reactionCounts={comment.reactionCounts}
            size="sm"
          />
          <button
            onClick={() => setShowReplyInput((v) => !v)}
            className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            <CornerDownRight size={12} /> রিপ্লে
          </button>
          <span className="text-[10px] text-gray-400">
            {moment(comment.createdAt).fromNow()}
          </span>
          {comment.user?._id === currentUser?._id && (
            <button
              onClick={handleDeleteComment}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <form
            onSubmit={handleReplySubmit}
            className="flex gap-2 items-center mt-2 ml-1"
          >
            <Link
        to={`/app/user/${comment.user?._id}`}
        className="font-medium text-text-main hover:text-primary transition-colors block truncate"
      >
            <Avatar
              src={currentUser?.profilePicture}
              className="w-6 h-6 flex-shrink-0"
            /> </Link>
            <div className="flex-1 flex bg-white border border-gray-200 rounded-full px-3 py-1 items-center focus-within:border-primary transition-all">
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${comment.user?.name?.split(" ")[0]}-কে রিপ্লে করুন...`}
                className="flex-1 bg-transparent border-none text-xs outline-none py-1"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || submitting}
                className="text-primary p-0.5 disabled:opacity-30"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Replies */}
        {replyCount > 0 && (
          <div className="mt-2 ml-1">
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-primary mb-2"
            >
              {showReplies ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
              {showReplies ? "রিপ্লে লুকান" : `${replyCount}টি রিপ্লে দেখুন`}
            </button>

            {showReplies && (
              <div className="space-y-2 border-l-2 border-gray-100 pl-3">
                {comment.replies.map((reply) => (
                  <ReplyItem
                    key={reply._id}
                    reply={reply}
                    postId={postId}
                    commentId={comment._id}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Comment Section ──────────────────────────────────────────────────────────

export default function CommentSection({ post, currentUser, visible }) {
  const dispatch = useAppDispatch();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCommentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      setSubmitting(true);
      try {
        const result = await dispatch(
          addComment({ postId: post._id, text: commentText }),
        );
        if (addComment.fulfilled.match(result)) setCommentText("");
      } catch (_) {
        toast.error("কমেন্ট করা যায়নি");
      }
      setSubmitting(false);
    },
    [commentText, post._id, dispatch],
  );

  if (!visible) return null;

  return (
    <div className="border-t border-gray-50 bg-gray-50/50 px-4 pb-4 animate-in fade-in duration-200">
      {/* Comments List */}
      <div className="space-y-3 pt-3 max-h-80 overflow-y-auto custom-scrollbar">
        {post.comments?.length === 0 && (
          <p className="text-xs text-center text-gray-400 py-2">
            প্রথম কমেন্ট করুন!
          </p>
        )}
        {post.comments?.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            postId={post._id}
            currentUser={currentUser}
          />
        ))}
      </div>

      {/* Comment Input */}
      <form
        onSubmit={handleCommentSubmit}
        className="flex gap-2 items-center mt-3"
      >
        <Avatar
          src={currentUser?.profilePicture}
          className="w-8 h-8 flex-shrink-0"
        />
        <div className="flex-1 flex bg-white border border-gray-200 rounded-full px-4 py-1 items-center focus-within:border-primary transition-all shadow-inner">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="কমেন্ট লিখুন..."
            className="flex-1 bg-transparent border-none py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || submitting}
            className="text-primary p-1 disabled:opacity-30 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
