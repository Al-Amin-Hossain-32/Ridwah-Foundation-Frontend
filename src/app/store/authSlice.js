import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "@/services/auth.service";

// ─── Async Thunks ─────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authService.login(credentials);
      // Backend returns: { success, message, data: { user, token } }
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await authService.register(userData);
      // Backend returns: { success, message, data: { user, token } }
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.getMe();
      // Backend returns: { success, data: user }
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ─── Helpers — localStorage sync ─────────────────────────────
const saveToStorage = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
const clearStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ─── Initial State ────────────────────────────────────────────
const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem("token") || null,
  isLoggedIn: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Manual logout
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      clearStorage();
    },
    // Update user data (profile edit)
    updateUserData(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    // Clear error
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ─── Login ───────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.isLoggedIn = true;
        state.loading = false;
        saveToStorage(token, user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ─── Register ────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.isLoggedIn = true;
        state.loading = false;
        saveToStorage(token, user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ─── Fetch Me ────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoggedIn = true; // নিশ্চিত করুন ইউজার লগইন অবস্থায় আছে
        state.loading = false;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // Token invalid হলে logout
        state.user = null;
        state.token = null;
        state.isLoggedIn = false;
        state.loading = false;
        clearStorage();
      });
  },
});

export const { logout, updateUserData, clearAuthError } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
