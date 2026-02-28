import { useState, useCallback } from 'react';
import { Image, Send } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { createPost } from '@/app/store/postSlice';
import { selectUser } from '@/app/store/authSlice';
import { Modal }    from '@/components/ui/Modal';
import { Button }   from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Avatar }   from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

/**
 * CreatePost
 *
 * আগের সমস্যা:
 * 1. useEffect দিয়ে fetchTimeline() call করা হচ্ছিল — CreatePost-এর কাজ না
 * 2. অনেক unused import (CardSkeleton, EmptyState, PostCard, selectTimeline, etc.)
 *
 * এখন: শুধু post তৈরির কাজ, বাকি কিছু না
 */
function CreatePost() {
  const dispatch = useAppDispatch();
  const me = useAppSelector(selectUser);

  const [showModal, setShowModal] = useState(false);
  const [content,   setContent]   = useState('');
  const [creating,  setCreating]  = useState(false);

  const handleCreate = useCallback(async () => {
    if (!content.trim()) { toast.error('কিছু লিখুন'); return; }

    setCreating(true);
    const result = await dispatch(createPost({ content }));
    if (createPost.fulfilled.match(result)) {
      toast.success('Post করা হয়েছে!');
      setContent('');
      setShowModal(false);
    } else {
      toast.error('Post করা যায়নি');
    }
    setCreating(false);
  }, [content, dispatch]);

  // Enter key দিয়েও submit করা যাবে (Shift+Enter = নতুন লাইন)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div>
      {/* Quick bar */}
      <div
        onClick={() => setShowModal(true)}
        className="flex items-center gap-sm bg-white rounded-[14px] p-3 shadow-card mb-md cursor-pointer hover:shadow-card-hover transition-all"
      >
        <Avatar src={me?.profilePicture} name={me?.name} size="sm" />
        <p className="text-small text-text-light flex-1">
          কী মনে হচ্ছে, {me?.name?.split(' ')[0]}?
        </p>
        <Image size={18} className="text-text-light" />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="নতুন Post"
        size="md"
      >
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Avatar src={me?.profilePicture} name={me?.name} size="sm" />
            <p className="font-medium text-text-main text-small">{me?.name}</p>
          </div>

          <Textarea
            placeholder="আপনার মনের কথা লিখুন..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
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
  );
}

export default CreatePost;