import { createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import friendService from './friend.service';

/* ─── helper ─────────────────────────────────────────────────── */
const getMsg = (err) =>
  err?.response?.data?.message ?? err?.message ?? 'কিছু একটা সমস্যা হয়েছে';

/* ─── read thunks ─────────────────────────────────────────────── */

export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const res = await friendService.getFriends();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getMsg(err));
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'friends/fetchSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await friendService.getSuggestions();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getMsg(err));
    }
  }
);

export const fetchRequests = createAsyncThunk(
  'friends/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await friendService.getRequests();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getMsg(err));
    }
  }
);

/**
 * Fetch friendship status for a specific user.
 * action.meta.arg === userId → slice-এ cache key হিসেবে ব্যবহার হয়
 * Returns: { status, direction?, friendshipId? }
 */
export const fetchFriendshipStatus = createAsyncThunk(
  'friends/fetchFriendshipStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await friendService.getStatus(userId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getMsg(err));
    }
  }
);

/* ─── action thunks ───────────────────────────────────────────── */

export const sendFriendRequest = createAsyncThunk(
  'friends/sendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      await friendService.sendRequest(userId);
      toast.success('ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে!');
      return userId;
    } catch (err) {
      toast.error(getMsg(err));
      return rejectWithValue(getMsg(err));
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await friendService.acceptRequest(requestId);
      toast.success('ফ্রেন্ড রিকোয়েস্ট অ্যাক্সেপ্ট হয়েছে!');
      return requestId;
    } catch (err) {
      toast.error(getMsg(err));
      return rejectWithValue(getMsg(err));
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await friendService.rejectRequest(requestId);
      toast.success('রিকোয়েস্ট রিজেক্ট করা হয়েছে');
      return requestId;
    } catch (err) {
      toast.error(getMsg(err));
      return rejectWithValue(getMsg(err));
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async (friendId, { rejectWithValue }) => {
    try {
      await friendService.removeFriend(friendId);
      toast.success('বন্ধু লিস্ট থেকে সরানো হয়েছে');
      return friendId;
    } catch (err) {
      toast.error(getMsg(err));
      return rejectWithValue(getMsg(err));
    }
  }
);