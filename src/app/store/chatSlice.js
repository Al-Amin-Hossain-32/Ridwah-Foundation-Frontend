import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import messageService from '@/services/message.service';

// ============================================================
// THUNKS
// ============================================================

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await messageService.conversations();
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await messageService.getMessages(conversationId, { page: 1, limit: 30 });
      return {
        conversationId,
        messages:   res.data?.messages ?? [],
        pagination: res.data?.pagination ?? { page: 1, pages: 1, total: 0 },
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const fetchOlderMessages = createAsyncThunk(
  'chat/fetchOlderMessages',
  async ({ conversationId, page }, { rejectWithValue }) => {
    try {
      const res = await messageService.getMessages(conversationId, { page, limit: 30 });
      return {
        conversationId,
        messages:   res.data?.messages ?? [],
        pagination: res.data?.pagination ?? {},
        page,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ receiverId, content, conversationId }, { rejectWithValue }) => {
    try {
      const res   = await messageService.send({ receiverId, content });
      const inner = res.data?.data ?? res.data;
      const msg   = inner?.message ?? inner;
      const convId =
        conversationId?.toString() ||
        msg?.conversation?._id?.toString() ||
        msg?.conversation?.toString() ||
        inner?.conversation?._id?.toString() ||
        inner?.conversation?.toString() ||
        null;
      return { message: msg, conversationId: convId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const res   = await messageService.update(id, { content });
      const inner = res.data?.data ?? res.data;
      return inner?.message ?? inner;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ id, deleteType = 'for_everyone' }, { rejectWithValue }) => {
    try {
      const res   = await messageService.remove(id, { deleteType });
      const inner = res.data?.data ?? res.data;
      return inner;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await messageService.unreadCount();
      return res.data?.count ?? 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (conversationId, { dispatch, rejectWithValue }) => {
    try {
      await messageService.markConversationRead(conversationId);
      dispatch(fetchUnreadCount());
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

// ============================================================
// HELPERS
// ============================================================

const toConvId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  return String(val);
};

const normalizeMsg = (m, cId) => ({
  ...m,
  conversation:   cId,
  conversationId: cId,
});

const sortAsc = (arr) =>
  [...arr].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const dedupe = (arr) => {
  const seen = new Set();
  return arr.filter((m) => {
    const id = String(m._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// ============================================================
// SLICE
// ============================================================

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    messages:      {},    // { [conversationId]: Message[] }
    pagination:    {},    // { [conversationId]: { page, pages, total, hasMore, loadingMore } }
    onlineUsers:   [],    // string[] of userIds currently online
    activeConvId:  null,
    unreadCount:   0,
    loading:       false,
    msgLoading:    false,
    sendLoading:   false,
    error:         null,
  },

  reducers: {
    setActiveConversation(state, action) {
      state.activeConvId = action.payload;
    },
    clearError(state) {
      state.error = null;
    },

    // ── Online presence ──────────────────────────────────────────────────────
    setOnlineUsers(state, action) {
      // action.payload = string[] of userIds
      state.onlineUsers = action.payload;
    },
    addOnlineUser(state, action) {
      const uid = action.payload;
      if (!state.onlineUsers.includes(uid)) state.onlineUsers.push(uid);
    },
    removeOnlineUser(state, action) {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },

    // ── Socket: new message ──────────────────────────────────────────────────
    receiveMessage(state, action) {
      const msg = action.payload;
      const cId = toConvId(msg.conversationId ?? msg.conversation);
      if (!cId) return;

      if (!state.messages[cId]) state.messages[cId] = [];

      const msgId  = String(msg._id ?? msg.messageId ?? '');
      const exists = state.messages[cId].some((m) => String(m._id) === msgId);

      if (!exists) {
        state.messages[cId].push({
          _id:            msgId,
          content:        msg.content,
          conversation:   cId,
          conversationId: cId,
          sender: msg.sender ?? {
            _id:            String(msg.senderId ?? ''),
            name:           msg.senderName ?? '',
            profilePicture: msg.senderPicture ?? '',
          },
          receiver:  msg.receiverId ?? null,
          isRead:    msg.isRead ?? false,
          isEdited:  false,
          isDeleted: false,
          createdAt: msg.createdAt ?? msg.timestamp ?? new Date().toISOString(),
        });
        state.messages[cId] = sortAsc(state.messages[cId]);
        if (state.pagination[cId]) state.pagination[cId].total += 1;
      }

      const conv = state.conversations.find((c) => String(c._id) === cId);
      if (conv) {
        conv.lastMessage = { content: msg.content, createdAt: msg.createdAt ?? msg.timestamp };
        conv.updatedAt   = msg.createdAt ?? msg.timestamp;
      }
    },

    // ── Socket: edit ─────────────────────────────────────────────────────────
    editMessageRealtime(state, action) {
      const { messageId, conversationId, newContent, editedAt } = action.payload;
      const cId  = String(conversationId ?? '');
      const msgs = state.messages[cId];
      if (msgs) {
        const msg = msgs.find((m) => String(m._id) === String(messageId));
        if (msg) { msg.content = newContent; msg.isEdited = true; msg.lastEditedAt = editedAt; }
      }
      const conv = state.conversations.find((c) => String(c._id) === cId);
      if (conv?.lastMessage && String(conv.lastMessage._id) === String(messageId))
        conv.lastMessage.content = newContent;
    },

    // ── Socket: delete ───────────────────────────────────────────────────────
    deleteMessageRealtime(state, action) {
      const { messageId, conversationId, deleteType } = action.payload;
      const cId  = String(conversationId ?? '');
      const msgs = state.messages[cId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => String(m._id) === String(messageId));
      if (idx === -1) return;
      if (deleteType === 'for_everyone') {
        msgs[idx].content    = 'This message was deleted';
        msgs[idx].isDeleted  = true;
        msgs[idx].deleteType = 'for_everyone';
      } else {
        msgs.splice(idx, 1);
      }
    },

    decrementUnread(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
  },

  extraReducers: (builder) => {

    // fetchConversations
    builder
      .addCase(fetchConversations.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchConversations.fulfilled, (s, a) => { s.loading = false; s.conversations = a.payload; })
      .addCase(fetchConversations.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    // fetchMessages (initial — REPLACE)
    builder
      .addCase(fetchMessages.pending,   (s) => { s.msgLoading = true; s.error = null; })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        const { conversationId: cId, messages, pagination } = a.payload;
        s.msgLoading = false;
        s.messages[cId] = sortAsc(messages.map((m) => normalizeMsg(m, cId)));
        s.pagination[cId] = {
          page:        pagination.page  ?? 1,
          pages:       pagination.pages ?? 1,
          total:       pagination.total ?? messages.length,
          hasMore:     (pagination.page ?? 1) < (pagination.pages ?? 1),
          loadingMore: false,
        };
      })
      .addCase(fetchMessages.rejected, (s, a) => { s.msgLoading = false; s.error = a.payload; });

    // fetchOlderMessages (PREPEND)
    builder
      .addCase(fetchOlderMessages.pending, (s, a) => {
        const cId = a.meta.arg.conversationId;
        if (s.pagination[cId]) s.pagination[cId].loadingMore = true;
      })
      .addCase(fetchOlderMessages.fulfilled, (s, a) => {
        const { conversationId: cId, messages: older, pagination, page } = a.payload;
        if (!s.messages[cId]) s.messages[cId] = [];
        s.messages[cId] = sortAsc(dedupe([
          ...older.map((m) => normalizeMsg(m, cId)),
          ...s.messages[cId],
        ]));
        s.pagination[cId] = {
          ...s.pagination[cId],
          page,
          pages:       pagination.pages ?? s.pagination[cId]?.pages ?? 1,
          total:       pagination.total ?? s.pagination[cId]?.total ?? 0,
          hasMore:     page < (pagination.pages ?? 1),
          loadingMore: false,
        };
      })
      .addCase(fetchOlderMessages.rejected, (s, a) => {
        const cId = a.meta.arg.conversationId;
        if (s.pagination[cId]) s.pagination[cId].loadingMore = false;
      });

    // sendMessage
    builder
      .addCase(sendMessage.pending,   (s) => { s.sendLoading = true; })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.sendLoading = false;
        const { message: msg, conversationId: cId } = a.payload;
        if (!msg?._id || !cId) return;
        if (!s.messages[cId]) s.messages[cId] = [];
        const exists = s.messages[cId].some((m) => String(m._id) === String(msg._id));
        if (!exists) {
          s.messages[cId].push(normalizeMsg(msg, cId));
          s.messages[cId] = sortAsc(s.messages[cId]);
          if (s.pagination[cId]) s.pagination[cId].total += 1;
        }
        const conv = s.conversations.find((c) => String(c._id) === cId);
        if (conv) { conv.lastMessage = normalizeMsg(msg, cId); conv.updatedAt = msg.createdAt; }
      })
      .addCase(sendMessage.rejected, (s, a) => { s.sendLoading = false; s.error = a.payload; });

    // editMessage
    builder
      .addCase(editMessage.fulfilled, (s, a) => {
        const msg = a.payload;
        if (!msg?._id) return;
        const cId = toConvId(msg.conversation);
        if (!cId || !s.messages[cId]) return;
        const m = s.messages[cId].find((x) => String(x._id) === String(msg._id));
        if (m) { m.content = msg.content; m.isEdited = true; m.lastEditedAt = msg.lastEditedAt; }
      })
      .addCase(editMessage.rejected, (s, a) => { s.error = a.payload; });

    // deleteMessage
    builder
      .addCase(deleteMessage.fulfilled, (s, a) => {
        const msg = a.payload?.message ?? a.payload;
        if (!msg?._id) return;
        const cId = toConvId(msg.conversation);
        if (!cId || !s.messages[cId]) return;
        const idx = s.messages[cId].findIndex((m) => String(m._id) === String(msg._id));
        if (idx === -1) return;
        if (msg.deleteType === 'for_everyone') {
          s.messages[cId][idx].content   = 'This message was deleted';
          s.messages[cId][idx].isDeleted = true;
        } else {
          s.messages[cId].splice(idx, 1);
        }
      })
      .addCase(deleteMessage.rejected, (s, a) => { s.error = a.payload; });

    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (s, a) => { s.unreadCount = a.payload; });

    // markAsRead
    builder.addCase(markAsRead.fulfilled, (s, a) => {
      const cId  = a.payload;
      const conv = s.conversations.find((c) => String(c._id) === cId);
      if (conv) conv.unreadCount = 0;
      if (s.messages[cId]) s.messages[cId].forEach((m) => { m.isRead = true; });
    });
  },
});

// ============================================================
// EXPORTS
// ============================================================

export const {
  setActiveConversation,
  clearError,
  receiveMessage,
  editMessageRealtime,
  deleteMessageRealtime,
  decrementUnread,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
} = chatSlice.actions;

export const selectConversations = (s) => s.chat.conversations;
export const selectMessages      = (cId) => (s) => s.chat.messages[cId] || [];
export const selectPagination    = (cId) => (s) => s.chat.pagination[cId] || { hasMore: false, loadingMore: false };
export const selectOnlineUsers   = (s) => s.chat.onlineUsers;
export const selectIsUserOnline  = (userId) => (s) => s.chat.onlineUsers.includes(userId);
export const selectUnreadCount   = (s) => s.chat.unreadCount;
export const selectActiveConvId  = (s) => s.chat.activeConvId;
export const selectChatLoading   = (s) => s.chat.loading;
export const selectMsgLoading    = (s) => s.chat.msgLoading;
export const selectSendLoading   = (s) => s.chat.sendLoading;
export const selectChatError     = (s) => s.chat.error;

export default chatSlice.reducer;