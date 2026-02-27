import { useEffect, useState } from 'react'
import { Plus, X, Image, Send } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchTimeline, createPost, selectTimeline, selectPostLoading } from '@/app/store/postSlice'
import { selectUser } from '@/app/store/authSlice'
import { Modal }       from '@/components/ui/Modal'
import { Button }      from '@/components/ui/Button'
import { Textarea }    from '@/components/ui/Input'
import { Avatar }      from '@/components/ui/Avatar'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState }  from '@/components/ui/EmptyState'
import { PostCard }    from '@/modules/social/PostCard'
import toast from 'react-hot-toast'

export default function TimelinePage() {
  const dispatch = useAppDispatch()
  const posts    = useAppSelector(selectTimeline)
  const loading  = useAppSelector(selectPostLoading)
  const me       = useAppSelector(selectUser)

  const [showModal, setShowModal] = useState(false)
  const [content,   setContent]   = useState('')
  const [creating,  setCreating]  = useState(false)

  useEffect(() => {
    dispatch(fetchTimeline())
  }, [dispatch])

  const handleCreate = async () => {
    if (!content.trim()) { toast.error('কিছু লিখুন'); return }
    setCreating(true)
    const result = await dispatch(createPost({ content }))
    if (createPost.fulfilled.match(result)) {
      toast.success('Post করা হয়েছে!')
      setContent('')
      setShowModal(false)
    } else {
      toast.error('Post করা যায়নি')
    }
    setCreating(false)
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h2 className="font-heading text-text-main">Community</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-xs bg-primary text-white rounded-btn px-3 py-2 text-small font-medium transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} /> Post
        </button>
      </div>

      {/* Create post quick bar */}
      <div
        onClick={() => setShowModal(true)}
        className="flex items-center gap-sm bg-white rounded-[14px] p-3 shadow-card mb-md cursor-pointer hover:shadow-card-hover transition-all"
      >
        <Avatar src={me?.avatar} name={me?.name} size="sm" />
        <p className="text-small text-text-light flex-1">কী মনে হচ্ছে, {me?.name?.split(' ')[0]}?</p>
        <Image size={18} className="text-text-light" />
      </div>

      {/* Timeline */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : posts.length > 0 ? (
        posts.map((p) => <PostCard key={p._id} post={p} />)
      ) : (
        <EmptyState
          icon="✍️"
          title="Timeline খালি"
          description="প্রথম post করুন!"
        />
      )}

      {/* Create Post Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="নতুন Post"
        size="md"
      >
        <div className="space-y-md">
          <div className="flex items-start gap-sm">
            <Avatar src={me?.avatar} name={me?.name} size="sm" />
            <p className="font-medium text-text-main text-small">{me?.name}</p>
          </div>

          <Textarea
            placeholder="আপনার মনের কথা লিখুন..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          <Button
            onClick={handleCreate}
            loading={creating}
            size="full"
            variant="primary"
          >
            <Send size={15} /> Post করুন
          </Button>
        </div>
      </Modal>
    </div>
  )
}
