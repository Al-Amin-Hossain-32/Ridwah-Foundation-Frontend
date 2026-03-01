import React, { useState, useCallback, useRef } from 'react';
import { Image, Send } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { createPost } from '@/app/store/postSlice';
import { selectUser } from '@/app/store/authSlice';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { EmojiPicker } from './EmojiPicker'; // ইমপোর্ট করুন
import toast from 'react-hot-toast';

function CreatePost() {
  const dispatch = useAppDispatch();
  const me = useAppSelector(selectUser);
  const textareaRef = useRef(null); // টেক্সটএরিয়া রেফারেন্স

  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  // ইমোজি সিলেক্ট করার হ্যান্ডলার
const handleEmojiSelect = (emoji) => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  // বর্তমান টেক্সট এবং কার্সার পজিশন নেওয়া
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const textBefore = content.substring(0, start);
  const textAfter = content.substring(end);

  // নতুন টেক্সট তৈরি (মাঝখানে ইমোজি বসানো)
  const newText = textBefore + emoji + textAfter;
  
  // ১. স্টেট আপডেট করা
  setContent(newText);

  // ২. কার্সারকে ইমোজির ঠিক পরে সেট করা
  // (স্টেট আপডেটের পর টেক্সট এরিয়া রেন্ডার হতে সময় নেয়, তাই setTimeout প্রয়োজন)
  setTimeout(() => {
    textarea.focus();
    const newCursorPos = start + emoji.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }, 10);
};

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div>
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

      <Modal className="overflow-visible" isOpen={showModal} onClose={() => setShowModal(false)} title="নতুন Post" size="md">
        <div className="space-y-md">
          <div className="flex items-center gap-sm">
            <Avatar src={me?.profilePicture} name={me?.name} size="sm" />
            <p className="font-medium text-text-main text-small">{me?.name}</p>
          </div>

          <div className="relative border rounded-xl focus-within:ring-2 ring-primary/20 transition-all border-gray-100">
            <Textarea
              ref={textareaRef} // রেফারেন্স সেট করা হয়েছে
              className="border-none focus:ring-0 w-full resize-none p-4 min-h-[120px]"
              placeholder="আপনার মনের কথা লিখুন..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            
            {/* Toolbar Area */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50/50 border-t border-gray-50">
              <div className="flex items-center gap-1">
                <button type="button" className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-primary transition-colors">
                  <Image size={20} />
                </button>
                
                {/* Emoji Picker */}
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
              
              <span className={`text-[10px] font-bold ${content.length > 500 ? 'text-red-400' : 'text-gray-300'}`}>
                {content.length} / 500
              </span>
            </div>
          </div>

          <Button onClick={handleCreate} loading={creating} size="full" variant="primary">
            <Send size={15} /> Post করুন
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default CreatePost;