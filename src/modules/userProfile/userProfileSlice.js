import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userProfileService from "./userProfile.service";
import { createSelector } from "@reduxjs/toolkit";

/* ─── helpers ──────────────────────────────────────────────────── */
const getMsg = (err) =>
  err?.response?.data?.message ?? err?.message ?? "কিছু একটা সমস্যা হয়েছে";

/* ─── thunks ───────────────────────────────────────────────────── */

export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
        console.log('🔥 fetching profile for:', userId); // ← যুক্ত করুন
      const res = await userProfileService.getProfile(userId);
      console.log('✅ response:', res.data); // ← যুক্ত করুন
      const user = res.data?.data;
      

      // backend সরাসরি user object দেয়
      // আমরা wrap করে নিচ্ছি
      return {
        user,
        friendCount:   0,   // পরে /users/:id/friends থেকে আসবে
        recentFriends: [],
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message ?? err.message);
    }
  }
);
export const fetchUserPosts = createAsyncThunk(
  "userProfile/fetchPosts",
  async ({ userId, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await userProfileService.getPosts(userId, page);
      return { ...res.data.data, page }; // { posts, total, hasMore, page }
    } catch (err) {
      return rejectWithValue(getMsg(err));
    }
  },
);

export const fetchUserFriends = createAsyncThunk(
  "userProfile/fetchFriends",
  async ({ userId, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await userProfileService.getFriends(userId, page);
      return { ...res.data.data, page }; // { friends, total, hasMore, page }
    } catch (err) {
      return rejectWithValue(getMsg(err));
    }
  },
);

/* ─── slice ────────────────────────────────────────────────────── */

const initialState = {
  // viewed profile
  user: null,
  friendCount: 0,
  recentFriends: [],

  // posts tab
  posts: [],
  postsPage: 1,
  postsHasMore: false,
  postsTotal: 0,

  // friends tab
  friends: [],
  friendsPage: 1,
  friendsHasMore: false,
  friendsTotal: 0,

  loading: {
    profile: false,
    posts: false,
    friends: false,
  },
  error: null,
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,

  reducers: {
    /** userId পরিবর্তন হলে সব clear করুন */
    resetProfile: () => initialState,
  },

  extraReducers: (builder) => {
    /* fetchUserProfile */
    builder
      .addCase(fetchUserProfile.pending, (s) => {
        s.loading.profile = true;
        s.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (s, { payload }) => {
        s.loading.profile = false;
        s.user = payload.user;
        s.friendCount = payload.friendCount;
        s.recentFriends = payload.recentFriends;
      })
      .addCase(fetchUserProfile.rejected, (s, { payload }) => {
        s.loading.profile = false;
        s.error = payload;
      });

    /* fetchUserPosts — append on load-more */
    builder
      .addCase(fetchUserPosts.pending, (s) => {
        s.loading.posts = true;
      })
      .addCase(fetchUserPosts.fulfilled, (s, { payload }) => {
        s.loading.posts = false;
        // page 1 হলে replace, বাকিগুলো append
        s.posts =
          payload.page === 1 ? payload.posts : [...s.posts, ...payload.posts];
        s.postsPage = payload.page;
        s.postsHasMore = payload.hasMore;
        s.postsTotal = payload.total;
      })
      .addCase(fetchUserPosts.rejected, (s) => {
        s.loading.posts = false;
      });

    /* fetchUserFriends — append on load-more */
    builder
      .addCase(fetchUserFriends.pending, (s) => {
        s.loading.friends = true;
      })
      .addCase(fetchUserFriends.fulfilled, (s, { payload }) => {
        s.loading.friends = false;
        s.friends =
          payload.page === 1
            ? payload.friends
            : [...s.friends, ...payload.friends];
        s.friendsPage = payload.page;
        s.friendsHasMore = payload.hasMore;
        s.friendsTotal = payload.total;
        s.friendCount = payload.total; // ← এটা যুক্ত করুন
      })
      .addCase(fetchUserFriends.rejected, (s) => {
        s.loading.friends = false;
      });
  },
});

export const { resetProfile } = userProfileSlice.actions;

const selectUserProfileState = (s) => s.userProfile;

// ── memoized selectors ────────────────────────────────────────
export const selectProfileUser = createSelector(
  selectUserProfileState,
  (s) => s.user,
);
export const selectProfileLoading = createSelector(
  selectUserProfileState,
  (s) => s.loading,
);
export const selectProfilePosts = createSelector(
  selectUserProfileState,
  (s) => ({
    posts: s.posts,
    hasMore: s.postsHasMore,
    page: s.postsPage,
    total: s.postsTotal,
    loading: s.loading.posts,
  }),
);
export const selectProfileFriends = createSelector(
  selectUserProfileState,
  (s) => ({
    friends: s.friends,
    hasMore: s.friendsHasMore,
    page: s.friendsPage,
    total: s.friendsTotal,
    loading: s.loading.friends,
    friendCount: s.friendCount,
    recentFriends: s.recentFriends,
  }),
);

export default userProfileSlice.reducer;
