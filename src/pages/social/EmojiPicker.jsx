import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EmojiPicker({ onEmojiSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640; // টেলউইন্ড sm ব্রেকপয়েন্ট

      if (isMobile) {
        // মোবাইলের জন্য: স্ক্রিনের একদম নিচে বা মাঝখানে ফিক্সড পজিশন
        setPickerPos({
          top: rect.top - 360, 
          left: (window.innerWidth - 280) / 2 // স্ক্রিনের মাঝখানে এলাইনমেন্ট
        });
      } else {
        // ডেস্কটপের জন্য: বাটনের ডান দিকে নিচে
        setPickerPos({
          top: rect.top - 360,
          left: rect.left // বাটনের বাম দিকে একটু সরিয়ে আনা যাতে ডান দিকটা ঠিক থাকে
        });
      }
    }
    setIsOpen(!isOpen);
  };

  // বাইরে ক্লিক করলে বন্ধ করার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target)) {
        const pickerElement = document.getElementById('global-emoji-picker');
        if (pickerElement && !pickerElement.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-2 rounded-full transition-all active:scale-90 ${
          isOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/10 text-gray-500 hover:text-primary'
        }`}
      >
        <Smile size={22} />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] pointer-events-none">
          <AnimatePresence>
            <motion.div
              id="global-emoji-picker"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: `${pickerPos.top}px`,
                left: `${pickerPos.left}px`,
                pointerEvents: 'auto'
              }}
              // max-w-full ব্যবহার করা হয়েছে রেসপনসিভনেস নিশ্চিত করতে
              className="shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-2xl border border-gray-100 bg-white overflow-hidden max-w-[90vw]"
            >
              <EmojiPickerReact
                theme={Theme.LIGHT}
                onEmojiClick={(emojiData) => {
                  onEmojiSelect(emojiData.emoji);
                  // setIsOpen(false); // ইউজার চাইলে ক্লিক করার পর বন্ধ করতে পারেন
                }}
                autoFocusSearch={false}
                width={280}
                height={350}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                searchPlaceHolder="খুঁজুন..."
              />
            </motion.div>
          </AnimatePresence>
          
          {/* স্বচ্ছ ব্যাকড্রপ */}
          <div 
            className="fixed inset-0 -z-10 pointer-events-auto cursor-default" 
            onClick={() => setIsOpen(false)} 
          />
        </div>,
        document.body
      )}
    </div>
  );
}