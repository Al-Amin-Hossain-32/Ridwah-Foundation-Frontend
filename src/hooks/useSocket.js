import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from './useRedux';
import { selectAuth, selectUser } from '@/app/store/authSlice';
import {
  receiveMessage,
  fetchUnreadCount,
  editMessageRealtime,
  deleteMessageRealtime,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
} from '@/app/store/chatSlice';
import {
  socketNewPost,
  socketPostDeleted,
  socketReactionUpdate,
  socketNewComment,
  socketCommentDeleted,
  socketNewReply,
  socketReplyDeleted,
  socketPostViewUpdated,
} from '@/app/store/postSlice';
import { socketNewNotification } from '@/app/store/notificationSlice';

// ── Donation + Campaign realtime actions ──────────────────────────────────────
import {
  socketNewDonation,
  socketDonationUpdated,
  fetchPendingCount,
} from '@/app/store/donationSlice';
import {
  socketCampaignProgressUpdated,
  socketCampaignCreated,
  socketCampaignUpdated,
  socketCampaignDeleted,
} from '@/app/store/campaignSlice';

let socketInstance = null;

export function useSocket() {
  const dispatch   = useAppDispatch();
  const { token, isLoggedIn } = useAppSelector(selectAuth);
  const currentUser = useAppSelector(selectUser);
  const socketRef   = useRef(null);

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // role ref — manager/admin হলে pending count load করবো
  const roleRef = useRef(currentUser?.role);
  useEffect(() => {
    const newRole = currentUser?.role;
    // role পরিবর্তন হলে pending count refresh করো
    if (newRole !== roleRef.current) {
      roleRef.current = newRole;
      if (['manager', 'admin'].includes(newRole)) {
        dispatch(fetchPendingCount());
      }
    }
  }, [currentUser?.role, dispatch]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      socketRef.current = null;
      return;
    }

    if (!socketInstance || !socketInstance.connected) {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
      socketInstance = io(import.meta.env.VITE_API_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketInstance;
    socket.removeAllListeners();

    // ── Connection ────────────────────────────────────────────────────────────
    socket.on('connect',    () => console.log('⚡ [Socket] Connected:', socket.id));
    socket.on('disconnect', (reason) => {
      console.log('❌ [Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') socket.connect();
    });
    socket.on('connect_error', (err) => console.error('⚠️ [Socket] Error:', err.message));

    // ── Online presence ───────────────────────────────────────────────────────
    socket.on('onlineUsers',    (userIds)    => dispatch(setOnlineUsers(userIds)));
    socket.on('userOnline',     ({ userId }) => dispatch(addOnlineUser(userId)));
    socket.on('userOffline',    ({ userId }) => dispatch(removeOnlineUser(userId)));

    // ── Chat ──────────────────────────────────────────────────────────────────
    socket.on('newMessage',     (msg)  => { dispatch(receiveMessage(msg)); dispatch(fetchUnreadCount()); });
    socket.on('messageEdited',  (data) => dispatch(editMessageRealtime(data)));
    socket.on('messageDeleted', (data) => dispatch(deleteMessageRealtime(data)));

    // ── Posts ─────────────────────────────────────────────────────────────────
    socket.on('newPost', (post) => {
      if (post.author?._id?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketNewPost(post));
    });
    socket.on('postDeleted',     (data) => dispatch(socketPostDeleted(data)));
    socket.on('reactionUpdate',  (data) => {
      if (data.userId?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketReactionUpdate(data));
    });
    socket.on('newComment',      (data) => {
      if (data.comment?.user?._id?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketNewComment(data));
    });
    socket.on('commentDeleted',  (data) => dispatch(socketCommentDeleted(data)));
    socket.on('newReply',        (data) => {
      if (data.reply?.user?._id?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketNewReply(data));
    });
    socket.on('replyDeleted',    (data) => dispatch(socketReplyDeleted(data)));
    socket.on('postViewUpdated', (data) => dispatch(socketPostViewUpdated(data)));

    // ── Notifications ─────────────────────────────────────────────────────────
    socket.on('newNotification', (n) => dispatch(socketNewNotification(n)));

    // ════════════════════════════════════════════════════════════════════════
    // ── DONATION realtime events ────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    // নতুন donation submit হলে → manager/admin এর badge বাড়বে
    socket.on('newDonation', (donation) => {
      dispatch(socketNewDonation(donation));
    });

    // Donation approve/reject হলে:
    //   → manager এর pending count কমবে
    //   → donor এর myList-এ status update হবে
    socket.on('donationStatusUpdated', (donation) => {
      dispatch(socketDonationUpdated(donation));
    });

    // ════════════════════════════════════════════════════════════════════════
    // ── CAMPAIGN realtime events ────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    // Donation approve হলে campaign progress বাড়বে (সবাই দেখবে)
    socket.on('campaignProgressUpdated', (data) => {
      // data: { campaignId, currentAmount, status, progressPercentage }
      dispatch(socketCampaignProgressUpdated(data));
    });

    // Manager campaign create/update/delete করলে সবার UI update
    socket.on('campaignCreated', (campaign) => {
      dispatch(socketCampaignCreated(campaign));
    });
    socket.on('campaignUpdated', (campaign) => {
      dispatch(socketCampaignUpdated(campaign));
    });
    socket.on('campaignDeleted', ({ campaignId }) => {
      dispatch(socketCampaignDeleted(campaignId));
    });

    return () => { socket.removeAllListeners(); };

  }, [isLoggedIn, token, dispatch]);

  // ── Emit helpers ─────────────────────────────────────────────────────────────
  const emitTyping = useCallback((receiverId) => {
    if (socketRef.current?.connected && receiverId)
      socketRef.current.emit('typing', { receiverId });
  }, []);

  const emitStopTyping = useCallback((receiverId) => {
    if (socketRef.current?.connected && receiverId)
      socketRef.current.emit('stopTyping', { receiverId });
  }, []);

  const emitMessageRead = useCallback((messageId, senderId) => {
    if (socketRef.current?.connected)
      socketRef.current.emit('messageRead', { messageId, senderId });
  }, []);

  return { socket: socketRef.current, emitTyping, emitStopTyping, emitMessageRead };
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => socketInstance?.disconnect());
}