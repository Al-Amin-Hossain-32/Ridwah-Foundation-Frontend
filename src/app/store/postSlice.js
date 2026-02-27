import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import postService from "@/services/post.service";

// ১. গ্লোবাল ফিড (সব ইউজারের পোস্ট) ফেচ করার থাঙ্ক
export const fetchGlobalFeed = createAsyncThunk(
  "posts/fetchGlobalFeed",
  async ({ page = 1 }, { rejectWithValue }) => {
    try {
      // সার্ভিস কল
      const res = await postService.feed(page); 
      
      // ব্যাকএন্ডের রেসপন্স অনুযায়ী ডাটা রিটার্ন
      return { 
        posts: res.data.posts, 
        page: res.data.pagination.page, 
        totalPages: res.data.pagination.pages 
      };
    } catch (err) {
      // Axios error handle
      const message = err.response?.data?.message || err.message;
      return rejectWithValue(message);
    }
  }
);

// ২. টাইমলাইন ফেচ (শুধু নিজের এবং বন্ধুদের পোস্ট)
export const fetchTimeline = createAsyncThunk(
  "posts/timeline",
  async (_, { rejectWithValue }) => {
    try {
      const res = await postService.timeline();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// ৩. পোস্ট তৈরি
export const createPost = createAsyncThunk(
  "posts/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await postService.create(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// ৪. লাইক পোস্ট
export const likePost = createAsyncThunk(
  "posts/like",
  async ({ postId }, { rejectWithValue }) => {
    try {
      const res = await postService.like(postId);
      return { postId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// ৫. কমেন্ট যোগ করা
export const addComment = createAsyncThunk(
  "posts/comment",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const res = await postService.comment(postId, { text });
      return { postId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// ৬. পোস্ট ডিলিট
export const deletePost = createAsyncThunk(
  "posts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await postService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const postSlice = createSlice({
  name: "posts",
  initialState: {
    timeline: [], // এই অ্যারেতেই গ্লোবাল নিউজফিড এবং টাইমলাইন রেন্ডার হবে
    loading: false,
    hasMore: true,
    page: 1,
    error: null,
  },
  reducers: {
    // ✅ Optimistic like toggle (আপনার কোড অনুযায়ী অক্ষত রাখা হয়েছে)
    updateLikeRealtime: (state, action) => {
      const { postId, currentUser } = action.payload;
      if (!postId || !currentUser?._id) return;

      const post = state.timeline.find((p) => p._id === postId);
      if (!post) return;

      if (!Array.isArray(post.likes)) post.likes = [];

      const existingIndex = post.likes.findIndex(l => 
        (typeof l === 'object' ? l._id : l) === currentUser._id
      );

      if (existingIndex > -1) {
        post.likes.splice(existingIndex, 1);
      } else {
        post.likes.push({
          _id: currentUser._id,
          name: currentUser.name || "User",
          profilePicture: currentUser.profilePicture || ""
        });
      }
    },
    // ফিড রিসেট করার জন্য (পেজ চেঞ্জ বা রিফ্রেশে কাজে লাগবে)
    resetPosts: (state) => {
      state.timeline = [];
      state.page = 1;
      state.hasMore = true;
    }
  },
  extraReducers: (builder) => {
    // --- Global Feed Reducers ---
    builder
      .addCase(fetchGlobalFeed.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchGlobalFeed.fulfilled, (s, a) => {
        s.loading = false;
        const fetchedPosts = a.payload.posts || [];
        
        if (a.payload.page === 1) {
          s.timeline = fetchedPosts;
        } else {
          // ডুপ্লিকেট রিমুভ করে নতুন পোস্ট পুশ করা (সিনিয়র প্র্যাকটিস)
          const newPosts = fetchedPosts.filter(
            (p) => !s.timeline.some((tp) => tp._id === p._id)
          );
          s.timeline = [...s.timeline, ...newPosts];
        }

        s.hasMore = fetchedPosts.length > 0;
        s.page = a.payload.page;
      })
      .addCase(fetchGlobalFeed.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });

    // --- Timeline Reducers ---
    builder
      .addCase(fetchTimeline.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchTimeline.fulfilled, (s, a) => {
        s.loading = false;
        s.timeline = a.payload.posts || a.payload;
      })
      .addCase(fetchTimeline.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });

    // --- Create, Like, Comment, Delete Reducers (আপনার কোড অনুযায়ী) ---
    builder.addCase(createPost.fulfilled, (s, a) => {
      const post = a.payload.post || a.payload.data || a.payload;
      s.timeline.unshift(post);
    });

    builder.addCase(likePost.fulfilled, (state, action) => {
      const { postId, data } = action.payload;
      const post = state.timeline.find((p) => p._id === postId);
      if (post && data.likes) {
        post.likes = data.likes;
        post.likeCount = data.likes.length;
      }
    });

    builder.addCase(addComment.fulfilled, (s, a) => {
      const { postId, data } = a.payload;
      const post = s.timeline.find((p) => p._id === postId);
      if (post) {
        // ব্যাকএন্ড ডাটা স্ট্রাকচার অনুযায়ী আপডেট
        post.comments = data.comments || data.post?.comments || post.comments;
      }
    });

    builder.addCase(deletePost.fulfilled, (s, a) => {
      s.timeline = s.timeline.filter((p) => p._id !== a.payload);
    });
  },
});

export const { updateLikeRealtime, resetPosts } = postSlice.actions;

// Selectors
export const selectTimeline = (s) => s.posts.timeline;
export const selectPostLoading = (s) => s.posts.loading;
export const selectHasMore = (s) => s.posts.hasMore;
export const selectPage = (s) => s.posts.page;

export default postSlice.reducer;