import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from './useRedux';
import { selectAuth } from '@/app/store/authSlice';
import {
  receiveMessage,
  fetchUnreadCount,
  editMessageRealtime,
  deleteMessageRealtime,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
} from '@/app/store/chatSlice';
import { updateLikeRealtime } from '@/app/store/postSlice';

let socketInstance = null;

export function useSocket() {
  const dispatch = useAppDispatch();
  const { token, isLoggedIn } = useAppSelector(selectAuth);
  const socketRef = useRef(null);

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

    const handleConnect = () => console.log('⚡ [Socket] Connected:', socket.id);

    // Online presence — server sends full list on connect
    const handleOnlineUsers = (userIds) => {
      dispatch(setOnlineUsers(userIds));
    };
    const handleUserOnline = ({ userId }) => {
      dispatch(addOnlineUser(userId));
    };
    const handleUserOffline = ({ userId }) => {
      dispatch(removeOnlineUser(userId));
    };

    const handleNewMessage = (message) => {
      dispatch(receiveMessage(message));
      dispatch(fetchUnreadCount());
    };
    const handleMessageEdited  = (data) => dispatch(editMessageRealtime(data));
    const handleMessageDeleted = (data) => dispatch(deleteMessageRealtime(data));
    const handlePostLiked = (data) =>
      dispatch(updateLikeRealtime({ postId: data.postId, userId: data.userId, actionType: data.action }));

    const handleDisconnect = (reason) => {
      console.log('❌ [Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') socket.connect();
    };
    const handleConnectError = (err) => console.error('⚠️ [Socket] Error:', err.message);

    socket.on('connect',            handleConnect);
    socket.on('onlineUsers',        handleOnlineUsers);
    socket.on('userOnline',         handleUserOnline);
    socket.on('userOffline',        handleUserOffline);
    socket.on('newMessage',         handleNewMessage);
    socket.on('messageEdited',      handleMessageEdited);
    socket.on('messageDeleted',     handleMessageDeleted);
    socket.on('postLiked',          handlePostLiked);
    socket.on('disconnect',         handleDisconnect);
    socket.on('connect_error',      handleConnectError);

    return () => {
      socket.off('connect',            handleConnect);
      socket.off('onlineUsers',        handleOnlineUsers);
      socket.off('userOnline',         handleUserOnline);
      socket.off('userOffline',        handleUserOffline);
      socket.off('newMessage',         handleNewMessage);
      socket.off('messageEdited',      handleMessageEdited);
      socket.off('messageDeleted',     handleMessageDeleted);
      socket.off('postLiked',          handlePostLiked);
      socket.off('disconnect',         handleDisconnect);
      socket.off('connect_error',      handleConnectError);
    };
  }, [isLoggedIn, token, dispatch]);

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

  return {
    socket: socketRef.current,
    emitTyping,
    emitStopTyping,
    emitMessageRead,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => socketInstance?.disconnect());
}