import { createSlice,createSelector } from '@reduxjs/toolkit';
import {
  fetchFriends,
  fetchSuggestions,
  fetchRequests,
  fetchFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from './friend.thunks';

/**
 * Friends Module Slice
 *
 * statusMap: { [userId]: { status, direction, friendshipId } }
 *   → per-user cache যাতে বারবার API call না হয়
 *
 * loading: object with granular keys
 *   → একটা operation-এর জন্য পুরো UI block না হয়
 */
const initialState = {
  friends:     [],
  suggestions: [],
  requests:    [],

  // per-user friendship status cache
  statusMap: {},

  // granular loading — avoid single boolean causing UI jank
  loading: {
    friends:     false,
    suggestions: false,
    requests:    false,
    status:      false,
    action:      false, // send / accept / reject / remove
  },

  error: null,
};

/* ─────────────────────────── slice ────────────────────────────── */

const friendSlice = createSlice({
  name: 'friends',
  initialState,

  reducers: {
    /**
     * Profile page-এ navigate করার সময় specific user-এর cache মুছুন।
     * userId দিলে → সেই user-এর cache, না দিলে → সব clear।
     */
    clearStatusCache(state, { payload: userId }) {
      if (userId) {
        delete state.statusMap[userId];
      } else {
        state.statusMap = {};
      }
    },
    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /* fetchFriends */
    builder
      .addCase(fetchFriends.pending,   (s) => { s.loading.friends = true; s.error = null; })
      .addCase(fetchFriends.fulfilled, (s, { payload }) => { s.loading.friends = false; s.friends = payload; })
      .addCase(fetchFriends.rejected,  (s, { payload }) => { s.loading.friends = false; s.error = payload; });

    /* fetchSuggestions */
    builder
      .addCase(fetchSuggestions.pending,   (s) => { s.loading.suggestions = true; })
      .addCase(fetchSuggestions.fulfilled, (s, { payload }) => { s.loading.suggestions = false; s.suggestions = payload; })
      .addCase(fetchSuggestions.rejected,  (s, { payload }) => { s.loading.suggestions = false; s.error = payload; });

    /* fetchRequests */
    builder
      .addCase(fetchRequests.pending,   (s) => { s.loading.requests = true; })
      .addCase(fetchRequests.fulfilled, (s, { payload }) => { s.loading.requests = false; s.requests = payload; })
      .addCase(fetchRequests.rejected,  (s, { payload }) => { s.loading.requests = false; s.error = payload; });

    /* fetchFriendshipStatus → cache by userId (action.meta.arg) */
    builder
      .addCase(fetchFriendshipStatus.pending,   (s) => { s.loading.status = true; })
      .addCase(fetchFriendshipStatus.fulfilled, (s, { payload, meta }) => {
        s.loading.status = false;
        s.statusMap[meta.arg] = payload; // meta.arg === userId passed to thunk
      })
      .addCase(fetchFriendshipStatus.rejected,  (s) => { s.loading.status = false; });

    /* sendFriendRequest → optimistic update */
    builder
      .addCase(sendFriendRequest.pending,   (s) => { s.loading.action = true; })
      .addCase(sendFriendRequest.fulfilled, (s, { payload: userId }) => {
        s.loading.action = false;
        // Optimistic: update cache immediately — no refetch needed
        s.statusMap[userId] = { status: 'pending', direction: 'sent' };
        // Remove from suggestions list
        s.suggestions = s.suggestions.filter((u) => u._id !== userId);
      })
      .addCase(sendFriendRequest.rejected,  (s) => { s.loading.action = false; });

    /* acceptFriendRequest */
    builder
      .addCase(acceptFriendRequest.pending,   (s) => { s.loading.action = true; })
      .addCase(acceptFriendRequest.fulfilled, (s, { payload: requestId }) => {
        s.loading.action = false;
        // requestId === friendship _id (requestId field from backend)
        s.requests = s.requests.filter((r) => r.requestId !== requestId);
      })
      .addCase(acceptFriendRequest.rejected,  (s) => { s.loading.action = false; });

    /* rejectFriendRequest */
    builder
      .addCase(rejectFriendRequest.pending,   (s) => { s.loading.action = true; })
      .addCase(rejectFriendRequest.fulfilled, (s, { payload: requestId }) => {
        s.loading.action = false;
        s.requests = s.requests.filter((r) => r.requestId !== requestId);
      })
      .addCase(rejectFriendRequest.rejected,  (s) => { s.loading.action = false; });

    /* removeFriend */
    builder
      .addCase(removeFriend.pending,   (s) => { s.loading.action = true; })
      .addCase(removeFriend.fulfilled, (s, { payload: friendId }) => {
        s.loading.action = false;
        s.friends     = s.friends.filter((f) => f._id !== friendId);
        s.statusMap[friendId] = { status: 'none' };
      })
      .addCase(removeFriend.rejected,  (s) => { s.loading.action = false; });
  },
});

export const { clearStatusCache, clearError } = friendSlice.actions;

/* ─── selectors ─────────────────────────────────────────────────── */
export const selectFriends         = (s) => s.friends.friends;
export const selectSuggestions     = (s) => s.friends.suggestions;
export const selectRequests        = (s) => s.friends.requests;
export const selectFriendLoading   = (s) => s.friends.loading;
export const selectFriendError     = (s) => s.friends.error;

/** Per-user selector — usage: useSelector(selectStatusFor(userId)) */
export const selectStatusFor = (userId) =>
  createSelector(
    (s) => s.friends.statusMap,
    (statusMap) => statusMap[userId] ?? { status: 'none' }
  );

export default friendSlice.reducer;