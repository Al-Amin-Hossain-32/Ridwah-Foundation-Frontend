import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import postService from "@/services/post.service";
import reactionService from "@/services/reaction.service";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchGlobalFeed = createAsyncThunk(
  "posts/fetchGlobalFeed",
  async ({ page = 1 }, { rejectWithValue }) => {
    try {
      const res = await postService.feed(page);
      return {
        posts: res.data.posts,
        page: res.data.pagination.page,
        totalPages: res.data.pagination.pages,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchTimeline = createAsyncThunk(
  "posts/fetchTimeline",
  async (_, { rejectWithValue }) => {
    try {
      const res = await postService.timeline();
      return { posts: res.data.posts || res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

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

export const toggleReaction = createAsyncThunk(
  "posts/toggleReaction",
  async (
    { targetType, targetId, reactionType, postId },
    { rejectWithValue },
  ) => {
    try {
      const res = await reactionService.toggle(
        targetType,
        targetId,
        reactionType,
      );
      return { targetType, targetId, postId, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const res = await postService.comment(postId, { text });
      return { postId, comment: res.data.data.comment };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteComment = createAsyncThunk(
  "posts/deleteComment",
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      await postService.deleteComment(postId, commentId);
      return { postId, commentId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const addReply = createAsyncThunk(
  "posts/addReply",
  async ({ postId, commentId, text }, { rejectWithValue }) => {
    try {
      const res = await postService.addReply(postId, commentId, { text });
      return { postId, commentId, reply: res.data.data.reply };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteReply = createAsyncThunk(
  "posts/deleteReply",
  async ({ postId, commentId, replyId }, { rejectWithValue }) => {
    try {
      await postService.deleteReply(postId, commentId, replyId);
      return { postId, commentId, replyId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyOptimisticReaction(target, reactionType) {
  const counts = { ...(target.reactionCounts || {}) };
  let userReaction = target.userReaction || null;
  let total = target.totalReactions || 0;

  if (userReaction === reactionType) {
    counts[reactionType] = Math.max(0, (counts[reactionType] || 1) - 1);
    total = Math.max(0, total - 1);
    userReaction = null;
  } else {
    if (userReaction) {
      counts[userReaction] = Math.max(0, (counts[userReaction] || 1) - 1);
    } else {
      total += 1;
    }
    counts[reactionType] = (counts[reactionType] || 0) + 1;
    userReaction = reactionType;
  }
  return { reactionCounts: counts, totalReactions: total, userReaction };
}

// একটাই posts Map — _id দিয়ে O(1) lookup
// কিন্তু Redux-এ Map serialize হয় না, তাই array রেখে helper দিয়ে খুঁজব
function findPost(posts, postId) {
  return posts.find((p) => p._id === postId);
}

function updatePost(posts, postId, updater) {
  const post = findPost(posts, postId);
  if (post) updater(post);
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const postSlice = createSlice({
  name: "posts",
  initialState: {
    /**
     * একটাই `posts` array — NewsFeed আর TimelinePage দুটোই এটা পড়বে।
     *
     * কেন একটা array?
     * দুটো আলাদা array রাখলে page switch করার সময় একটা empty হয়ে যায়।
     * Socket event তখন empty array-তে post খুঁজে পায় না — update হয় না।
     * একটা shared array থাকলে যে page-এই থাকুক, data সবসময় আছে।
     *
     * NewsFeed filter: সব post দেখায় (posts array সরাসরি)
     * TimelinePage filter: selectTimelinePosts selector দিয়ে
     *                      শুধু নিজের + বন্ধুদের post filter করে
     */
    posts: [],

    // Pagination — শুধু GlobalFeed-এর জন্য
    feedLoading: false,
    feedHasMore: true,
    feedPage: 1,

    // Timeline loading
    timelineLoading: false,

    // Timeline-এ কার কার post দেখাবে তার id list
    // fetchTimeline সফল হলে এই list populate হয়
    timelineAuthorIds: [],

    error: null,
  },
  reducers: {
    // Feed pagination reset — page 1 থেকে আবার load করতে
    resetFeedPagination: (state) => {
      state.feedPage = 1;
      state.feedHasMore = true;
      // posts array reset করা হচ্ছে না!
      // শুধু নতুন fetch-এর পর merge হবে
    },

    // ── Socket handlers ───────────────────────────────────────────────────────

    socketNewPost: (state, action) => {
      const post = action.payload;
      if (!state.posts.some((p) => p._id === post._id)) {
        state.posts.unshift(post);
        // নতুন author timeline-এ দেখাবে কিনা সেটা
        // timelineAuthorIds-এ থাকলে দেখাবে (selector handle করবে)
      }
    },

    socketPostDeleted: (state, action) => {
      state.posts = state.posts.filter((p) => p._id !== action.payload.postId);
    },

    socketReactionUpdate: (state, action) => {
      const { targetType, targetId, counts } = action.payload;

      if (targetType === "post") {
        updatePost(state.posts, targetId, (post) => {
          post.reactionCounts = counts.counts;
          post.totalReactions = counts.total;
        });
      } else if (targetType === "comment") {
        for (const post of state.posts) {
          const comment = post.comments?.find((c) => c._id === targetId);
          if (comment) {
            comment.reactionCounts = counts.counts;
            comment.totalReactions = counts.total;
            break;
          }
        }
      } else if (targetType === "reply") {
        outer: for (const post of state.posts) {
          for (const comment of post.comments || []) {
            const reply = comment.replies?.find((r) => r._id === targetId);
            if (reply) {
              reply.reactionCounts = counts.counts;
              reply.totalReactions = counts.total;
              break outer;
            }
          }
        }
      }
    },

    socketNewComment: (state, action) => {
      const { postId, comment } = action.payload;
      updatePost(state.posts, postId, (post) => {
        if (!post.comments?.some((c) => c._id === comment._id)) {
          post.comments = [...(post.comments || []), comment];
        }
      });
    },

    socketCommentDeleted: (state, action) => {
      const { postId, commentId } = action.payload;
      updatePost(state.posts, postId, (post) => {
        post.comments = post.comments?.filter((c) => c._id !== commentId);
      });
    },

    socketNewReply: (state, action) => {
      const { postId, commentId, reply } = action.payload;
      updatePost(state.posts, postId, (post) => {
        const comment = post.comments?.find((c) => c._id === commentId);
        if (comment && !comment.replies?.some((r) => r._id === reply._id)) {
          comment.replies = [...(comment.replies || []), reply];
        }
      });
    },

    socketReplyDeleted: (state, action) => {
      const { postId, commentId, replyId } = action.payload;
      updatePost(state.posts, postId, (post) => {
        const comment = post.comments?.find((c) => c._id === commentId);
        if (comment) {
          comment.replies = comment.replies?.filter((r) => r._id !== replyId);
        }
      });
    },
    socketPostViewUpdated: (state, action) => {
      const { postId, viewCount } = action.payload;
      updatePost(state.posts, postId, (post) => {
        post.viewCount = viewCount;
      });
    },
  },

  extraReducers: (builder) => {
    // ── GlobalFeed: নতুন post গুলো merge করো, replace নয় ───────────────────
    builder
      .addCase(fetchGlobalFeed.pending, (s) => {
        s.feedLoading = true;
      })
      .addCase(fetchGlobalFeed.fulfilled, (s, a) => {
        s.feedLoading = false;
        const fetched = a.payload.posts || [];

        if (a.payload.page === 1) {
          // Page 1: server থেকে আসা posts দিয়ে replace করো
          // কিন্তু socket-এ আসা নতুন post যেগুলো server-এ এখনো নেই
          // সেগুলো হারিয়ে যাবে — তাই merge করতে হবে
          const existingIds = new Set(fetched.map((p) => p._id));
          // socket থেকে আসা নতুন posts (server fetch-এ নেই)
          const socketOnlyPosts = s.posts.filter(
            (p) => !existingIds.has(p._id),
          );
          s.posts = [...socketOnlyPosts, ...fetched];
        } else {
          // Pagination: নতুন posts append করো
          const existingIds = new Set(s.posts.map((p) => p._id));
          const newPosts = fetched.filter((p) => !existingIds.has(p._id));
          s.posts = [...s.posts, ...newPosts];
        }

        s.feedHasMore = fetched.length > 0;
        s.feedPage = a.payload.page;
        s.error = null;
      })
      .addCase(fetchGlobalFeed.rejected, (s, a) => {
        s.feedLoading = false;
        s.error = a.payload;
      });

    // ── Timeline: posts merge করো + author id list সংরক্ষণ করো ─────────────
    builder
      .addCase(fetchTimeline.pending, (s) => {
        s.timelineLoading = true;
      })
      .addCase(fetchTimeline.fulfilled, (s, a) => {
        s.timelineLoading = false;
        const fetched = a.payload.posts || [];

        // Author id list: selector এটা দিয়ে filter করবে
        s.timelineAuthorIds = [
          ...new Set(
            fetched.map((p) => p.author?._id?.toString()).filter(Boolean),
          ),
        ];

        // Posts merge করো — replace নয়
        // GlobalFeed থেকে আনা posts হারিয়ে যাবে না
        const existingIds = new Set(s.posts.map((p) => p._id));
        const newPosts = fetched.filter((p) => !existingIds.has(p._id));
        if (newPosts.length > 0) {
          s.posts = [...newPosts, ...s.posts];
        }

        s.error = null;
      })
      .addCase(fetchTimeline.rejected, (s, a) => {
        s.timelineLoading = false;
        s.error = a.payload;
      });

    // ── createPost ────────────────────────────────────────────────────────────
    builder.addCase(createPost.fulfilled, (s, a) => {
      const post = a.payload.data || a.payload;
      if (!s.posts.some((p) => p._id === post._id)) {
        s.posts.unshift(post);
      }
      // নিজের author id timeline-এ যোগ করো
      const authorId = post.author?._id?.toString();
      if (authorId && !s.timelineAuthorIds.includes(authorId)) {
        s.timelineAuthorIds.push(authorId);
      }
    });

    // ── deletePost ────────────────────────────────────────────────────────────
    builder.addCase(deletePost.fulfilled, (s, a) => {
      s.posts = s.posts.filter((p) => p._id !== a.payload);
    });

    // ── toggleReaction (optimistic + server sync) ─────────────────────────────
    builder
      .addCase(toggleReaction.pending, (state, action) => {
        const { targetType, targetId, reactionType, postId } = action.meta.arg;

        if (targetType === "post") {
          updatePost(state.posts, targetId, (post) => {
            Object.assign(post, applyOptimisticReaction(post, reactionType));
          });
        } else if (targetType === "comment") {
          updatePost(state.posts, postId, (post) => {
            const comment = post.comments?.find((c) => c._id === targetId);
            if (comment)
              Object.assign(
                comment,
                applyOptimisticReaction(comment, reactionType),
              );
          });
        } else if (targetType === "reply") {
          updatePost(state.posts, postId, (post) => {
            for (const c of post.comments || []) {
              const reply = c.replies?.find((r) => r._id === targetId);
              if (reply) {
                Object.assign(
                  reply,
                  applyOptimisticReaction(reply, reactionType),
                );
                break;
              }
            }
          });
        }
      })
      .addCase(toggleReaction.fulfilled, (state, action) => {
        const { targetType, targetId, postId, data } = action.payload;
        const { counts, reactionType, action: act } = data;

        const applyServer = (target) => {
          target.reactionCounts = counts.counts;
          target.totalReactions = counts.total;
          target.userReaction = act === "removed" ? null : reactionType;
        };

        if (targetType === "post") {
          updatePost(state.posts, targetId, applyServer);
        } else if (targetType === "comment") {
          updatePost(state.posts, postId, (post) => {
            const comment = post.comments?.find((c) => c._id === targetId);
            if (comment) applyServer(comment);
          });
        } else if (targetType === "reply") {
          updatePost(state.posts, postId, (post) => {
            for (const c of post.comments || []) {
              const reply = c.replies?.find((r) => r._id === targetId);
              if (reply) {
                applyServer(reply);
                break;
              }
            }
          });
        }
      });

    // ── addComment ────────────────────────────────────────────────────────────
    builder.addCase(addComment.fulfilled, (s, a) => {
      const { postId, comment } = a.payload;
      updatePost(s.posts, postId, (post) => {
        if (!post.comments?.some((c) => c._id === comment._id)) {
          post.comments = [...(post.comments || []), comment];
        }
      });
    });

    builder.addCase(deleteComment.fulfilled, (s, a) => {
      const { postId, commentId } = a.payload;
      updatePost(s.posts, postId, (post) => {
        post.comments = post.comments?.filter((c) => c._id !== commentId);
      });
    });

    // ── addReply ──────────────────────────────────────────────────────────────
    builder.addCase(addReply.fulfilled, (s, a) => {
      const { postId, commentId, reply } = a.payload;
      updatePost(s.posts, postId, (post) => {
        const comment = post.comments?.find((c) => c._id === commentId);
        if (comment && !comment.replies?.some((r) => r._id === reply._id)) {
          comment.replies = [...(comment.replies || []), reply];
        }
      });
    });

    builder.addCase(deleteReply.fulfilled, (s, a) => {
      const { postId, commentId, replyId } = a.payload;
      updatePost(s.posts, postId, (post) => {
        const comment = post.comments?.find((c) => c._id === commentId);
        if (comment) {
          comment.replies = comment.replies?.filter((r) => r._id !== replyId);
        }
      });
    });
  },
});

export const {
  resetFeedPagination,
  socketNewPost,
  socketPostDeleted,
  socketReactionUpdate,
  socketNewComment,
  socketCommentDeleted,
  socketNewReply,
  socketReplyDeleted,
  socketPostViewUpdated
} = postSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

// NewsFeed: সব posts (createdAt desc order ধরে নেওয়া হচ্ছে)
export const selectFeed = (s) => s.posts.posts;
export const selectFeedLoading = (s) => s.posts.feedLoading;
export const selectFeedHasMore = (s) => s.posts.feedHasMore;
export const selectFeedPage = (s) => s.posts.feedPage;

// TimelinePage: শুধু timeline authors-এর posts
// এই selector-এ filter হচ্ছে — socket update এলে automatically
// দুটো page-এই reflect হবে কারণ একই posts array
export const selectTimelinePosts = (s) =>
  s.posts.posts.filter((p) =>
    s.posts.timelineAuthorIds.includes(p.author?._id?.toString()),
  );
export const selectTimelineLoading = (s) => s.posts.timelineLoading;
export const selectTimelineAuthorIds = (s) => s.posts.timelineAuthorIds;

// backward compat
export const selectTimeline = selectTimelinePosts;
export const selectPostLoading = (s) =>
  s.posts.feedLoading || s.posts.timelineLoading;
export const selectHasMore = (s) => s.posts.feedHasMore;
export const selectPage = (s) => s.posts.feedPage;

export default postSlice.reducer;
