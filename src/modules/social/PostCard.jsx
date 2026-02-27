import { useState } from 'react'
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { likePost, deletePost } from '@/app/store/postSlice'
import { selectUser } from '@/app/store/authSlice'
import { Card }   from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/utils/formatters'

/**
 * PostCard — Social timeline post
 * Like / Comment / Delete support
 */
export function PostCard({ post }) {
  const dispatch    = useAppDispatch()
  const currentUser = useAppSelector(selectUser)
  const [showMenu,  setShowMenu]  = useState(false)
  const [showComments, setShowComments] = useState(false)

  const isLiked   = post.likes?.includes(currentUser?._id)
  const isOwner   = post.author?._id === currentUser?._id

  const handleLike = () => {
    dispatch(likePost({ postId: post._id, userId: currentUser?._id }))
  }

  const handleDelete = async () => {
    if (window.confirm('Post delete করবেন?')) {
      dispatch(deletePost(post._id))
    }
    setShowMenu(false)
  }

  return (
    <Card className="mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-sm">
          <Avatar
            src={post.author?.avatar}
            name={post.author?.name}
            size="sm"
          />
          <div>
            <p className="font-medium text-text-main text-small leading-tight">
              {post.author?.name || 'Anonymous'}
            </p>
            <p className="text-[13px] text-text-light">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Options */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((p) => !p)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-text-light transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-card shadow-card-hover border border-gray-100 z-10 w-36">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-small text-red-600 hover:bg-red-50 rounded-card transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-text-main leading-relaxed mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt="post"
          className="w-full rounded-[10px] mb-3 object-cover max-h-64"
          loading="lazy"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-lg border-t border-gray-100 pt-3">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-xs transition-colors ${
            isLiked ? 'text-red-500' : 'text-text-secondary hover:text-red-400'
          }`}
        >
          <Heart
            size={18}
            fill={isLiked ? 'currentColor' : 'none'}
            className="transition-transform active:scale-125"
          />
          <span className="text-small font-medium">
            {post.likes?.length || 0}
          </span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((p) => !p)}
          className="flex items-center gap-xs text-text-secondary hover:text-primary transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-small font-medium">
            {post.comments?.length || 0}
          </span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && post.comments?.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          {post.comments.map((c, i) => (
            <div key={i} className="flex items-start gap-xs">
              <Avatar src={c.user?.avatar} name={c.user?.name} size="xs" />
              <div className="flex-1 bg-gray-50 rounded-[10px] px-3 py-2">
                <p className="text-[13px] font-medium text-text-main">
                  {c.user?.name}
                </p>
                <p className="text-small text-text-secondary">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
