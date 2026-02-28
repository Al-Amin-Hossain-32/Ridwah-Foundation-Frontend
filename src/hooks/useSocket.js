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
} from '@/app/store/postSlice';
import { socketNewNotification } from '@/app/store/notificationSlice';

let socketInstance = null;

export function useSocket() {
  const dispatch = useAppDispatch();
  const { token, isLoggedIn } = useAppSelector(selectAuth);
  const currentUser = useAppSelector(selectUser);
  const socketRef = useRef(null);

  // currentUser কে ref-এ রাখি — dependency array-এ না রেখেও
  // handler-এর ভেতরে সবসময় latest value পাওয়া যাবে
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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

    // প্রতিবার effect চলার আগে সব listener সরাও — duplicate এর কোনো সুযোগ নেই
    socket.removeAllListeners();

    // ── আগের handlers ────────────────────────────────────────────────────────
    socket.on('connect',    () => console.log('⚡ [Socket] Connected:', socket.id));
    socket.on('disconnect', (reason) => {
      console.log('❌ [Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') socket.connect();
    });
    socket.on('connect_error', (err) => console.error('⚠️ [Socket] Error:', err.message));

    socket.on('onlineUsers',    (userIds)    => dispatch(setOnlineUsers(userIds)));
    socket.on('userOnline',     ({ userId }) => dispatch(addOnlineUser(userId)));
    socket.on('userOffline',    ({ userId }) => dispatch(removeOnlineUser(userId)));
    socket.on('newMessage',     (message)    => { dispatch(receiveMessage(message)); dispatch(fetchUnreadCount()); });
    socket.on('messageEdited',  (data)       => dispatch(editMessageRealtime(data)));
    socket.on('messageDeleted', (data)       => dispatch(deleteMessageRealtime(data)));

    // ── Post handlers ─────────────────────────────────────────────────────────
    socket.on('newPost', (post) => {
      // নিজের post createPost.fulfilled-এ আগেই add হয়েছে
      if (post.author?._id?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketNewPost(post));
    });

    socket.on('postDeleted', (data) => dispatch(socketPostDeleted(data)));

    // ── Reaction handlers ─────────────────────────────────────────────────────
    socket.on('reactionUpdate', (data) => {
      // নিজের reaction optimistic update-এ already হয়েছে
      if (data.userId?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketReactionUpdate(data));
    });

    // ── Comment handlers ──────────────────────────────────────────────────────
    socket.on('newComment', (data) => {
      // নিজের comment addComment.fulfilled-এ already হয়েছে
      if (data.comment?.user?._id?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketNewComment(data));
    });

    socket.on('commentDeleted', (data) => dispatch(socketCommentDeleted(data)));

    // ── Reply handlers ────────────────────────────────────────────────────────
    socket.on('newReply', (data) => {
      // নিজের reply addReply.fulfilled-এ already হয়েছে
      if (data.reply?.user?._id?.toString() === currentUserRef.current?._id?.toString()) return;
      dispatch(socketNewReply(data));
    });

    socket.on('replyDeleted',    (data)         => dispatch(socketReplyDeleted(data)));
    socket.on('newNotification', (notification) => dispatch(socketNewNotification(notification)));

    return () => {
      socket.removeAllListeners();
    };

  // currentUser?._id dependency array থেকে বাদ — ref দিয়ে handle হচ্ছে
  // এটাই আগের duplicate listener-এর কারণ ছিল
  }, [isLoggedIn, token, dispatch]);

  // ── Emit helpers (অপরিবর্তিত) ────────────────────────────────────────────
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