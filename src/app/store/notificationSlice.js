import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '@/services/notification.service';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (page = 1, { rejectWithValue }) => {
    try {
      const res = await notificationService.getAll(page);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllRead();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {
    // Called from socket event
    socketNewNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data;
        s.unreadCount = a.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (s) => { s.loading = false; });

    builder.addCase(markRead.fulfilled, (s, a) => {
      const n = s.items.find((i) => i._id === a.payload);
      if (n && !n.read) {
        n.read = true;
        s.unreadCount = Math.max(0, s.unreadCount - 1);
      }
    });

    builder.addCase(markAllRead.fulfilled, (s) => {
      s.items.forEach((i) => (i.read = true));
      s.unreadCount = 0;
    });
  },
});

export const { socketNewNotification } = notificationSlice.actions;

export const selectNotifications = (s) => s.notifications.items;
export const selectUnreadCount = (s) => s.notifications.unreadCount;

export default notificationSlice.reducer;