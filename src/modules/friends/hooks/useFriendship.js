import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFriendshipStatus,
  sendFriendRequest,
  removeFriend,
} from '../friend.thunks';
import { selectStatusFor, selectFriendLoading, clearStatusCache } from '../friendSlice';

/**
 * useFriendship
 *
 * একটি target user-এর সাথে friendship সম্পূর্ণ manage করার hook।
 * Component unmount-এ cache clear হয়।
 *
 * @param   {string} targetUserId
 * @returns {{ status, direction, friendshipId, isStatusLoading, isActionLoading, send, remove }}
 */
const useFriendship = (targetUserId) => {
  const dispatch  = useDispatch();
  const info      = useSelector(selectStatusFor(targetUserId));
  const loading   = useSelector(selectFriendLoading);

  useEffect(() => {
    if (!targetUserId) return;
    dispatch(fetchFriendshipStatus(targetUserId));

    return () => dispatch(clearStatusCache(targetUserId));
  }, [targetUserId, dispatch]);

  return {
    status:          info.status ?? 'none',
    direction:       info.direction,
    friendshipId:    info.friendshipId,
    isStatusLoading: loading.status,
    isActionLoading: loading.action,
    send:   () => targetUserId && dispatch(sendFriendRequest(targetUserId)),
    remove: () => targetUserId && dispatch(removeFriend(targetUserId)),
  };
};

export default useFriendship;