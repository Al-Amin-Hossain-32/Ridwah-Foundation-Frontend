import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; // আপনার API ইন্সট্যান্স ব্যবহার করুন

export const getFriendshipStatus = createAsyncThunk(
  'friends/getStatus',
  async (targetUserId) => {
    // নোট: আপনার ব্যাকএন্ডে এই রুটটি নিশ্চিত করুন
    const response = await axios.get(`/api/friends/status/${targetUserId}`);
    return response.data.data; // null | 'pending' | 'accepted'
  }
);

export const sendFriendRequestAction = createAsyncThunk(
  'friends/sendRequest',
  async (targetUserId) => {
    const response = await axios.post(`/api/friends/request/${targetUserId}`);
    return response.data.data;
  }
);

const friendSlice = createSlice({
  name: 'friends',
  initialState: {
    status: null, // 'pending' | 'accepted' | null
    loading: false,
  },
  reducers: {
    resetFriendStatus: (state) => {
      state.status = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFriendshipStatus.pending, (state) => { state.loading = true; })
      .addCase(getFriendshipStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(sendFriendRequestAction.fulfilled, (state) => {
        state.status = 'pending';
      });
  },
});

export const { resetFriendStatus } = friendSlice.actions;
export default friendSlice.reducer;