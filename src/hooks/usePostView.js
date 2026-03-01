import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/hooks/useRedux';
import { socketPostViewUpdated } from '@/app/store/postSlice';
import postService from '@/services/post.service';

/**
 * usePostView
 *
 * PostCard-এ use করুন।
 * Post ৩ সেকেন্ড visible থাকলে view count API call করে।
 * একই post-এ একবারই call হয় (session-এ track করা হয়)।
 *
 * @param {string} postId
 * @param {HTMLElement} ref — post container-এর ref
 */

// Session-এ কোন posts view হয়েছে track করা — page refresh না হওয়া পর্যন্ত
const viewedPosts = new Set();

export function usePostView(postId, containerRef) {
  const dispatch    = useAppDispatch();
  const timerRef    = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!postId || !containerRef.current) return;
    if (viewedPosts.has(postId)) return; // এই session-এ already viewed

    const handleVisible = (entries) => {
      const entry = entries[0];

      if (entry.isIntersecting) {
        // Post visible — ৩ সেকেন্ড timer শুরু
        timerRef.current = setTimeout(async () => {
          if (viewedPosts.has(postId)) return;
          viewedPosts.add(postId);

          try {
            const res = await postService.view(postId);
            const viewCount = res.data?.data?.viewCount;

            // Redux-এ optimistically update করো
            if (viewCount !== undefined) {
              dispatch(socketPostViewUpdated({ postId, viewCount }));
            }
          } catch (_) {
            // view count fail হলে চুপচাপ ignore
          }
        }, 3000);

      } else {
        // Post visible না — timer cancel
        clearTimeout(timerRef.current);
      }
    };

    observerRef.current = new IntersectionObserver(handleVisible, {
      threshold: 0.5, // Post-এর ৫০% visible হলে count শুরু হবে
    });

    observerRef.current.observe(containerRef.current);

    return () => {
      clearTimeout(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, [postId, containerRef, dispatch]);
}