import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import donationService from '@/services/donation.service'

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchMyDonations = createAsyncThunk(
  'donations/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await donationService.myDonations()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchLeaderboard = createAsyncThunk(
  'donations/leaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await donationService.leaderboard()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const submitDonation = createAsyncThunk(
  'donations/submit',
  async (data, { rejectWithValue }) => {
    try {
      const res = await donationService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ── Manager / Admin thunks ────────────────────────────────────────────────────

export const fetchAllDonations = createAsyncThunk(
  'donations/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await donationService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchPendingCount = createAsyncThunk(
  'donations/fetchPendingCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await donationService.getAll({ status: 'pending', limit: 1 })
      return res.data?.pagination?.total ?? res.data?.total ?? 0
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchAnalytics = createAsyncThunk(
  'donations/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await donationService.analytics()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const approveDonation = createAsyncThunk(
  'donations/approve',
  async (id, { rejectWithValue }) => {
    try {
      const res = await donationService.approve(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const rejectDonation = createAsyncThunk(
  'donations/reject',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await donationService.reject(id, reason)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const donationSlice = createSlice({
  name: 'donations',
  initialState: {
    myList:        [],
    allList:       [],
    leaderboard:   [],
    analytics:     null,
    pendingCount:  0,
    loading:       false,
    submitLoad:    false,
    analyticsLoad: false,  // ← আগের slice-এ missing ছিল — selector ছিল কিন্তু state নেই = undefined crash
    error:         null,
  },

  reducers: {
    socketNewDonation(state, action) {
      const donation = action.payload
      state.allList.unshift(donation)
      if (donation.status === 'pending') state.pendingCount += 1
    },

    socketDonationUpdated(state, action) {
      const updated = action.payload
      const idx = state.allList.findIndex((d) => d._id === updated._id)
      if (idx !== -1) state.allList[idx] = updated
      const myIdx = state.myList.findIndex((d) => d._id === updated._id)
      if (myIdx !== -1) state.myList[myIdx] = updated
      if (updated.status !== 'pending') {
        state.pendingCount = Math.max(0, state.pendingCount - 1)
      }
    },

    setPendingCount(state, action) {
      state.pendingCount = action.payload
    },
  },

  extraReducers: (builder) => {
    // My donations
    builder
      .addCase(fetchMyDonations.pending,   (s) => { s.loading = true })
      .addCase(fetchMyDonations.fulfilled, (s, a) => {
        s.loading = false
        s.myList  = a.payload.donations || a.payload
      })
      .addCase(fetchMyDonations.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    // Leaderboard
    builder.addCase(fetchLeaderboard.fulfilled, (s, a) => {
      const p = a.payload
      s.leaderboard = Array.isArray(p) ? p
        : Array.isArray(p?.leaderboard) ? p.leaderboard
        : Array.isArray(p?.data)        ? p.data
        : []
    })

    // Submit
    builder
      .addCase(submitDonation.pending,   (s) => { s.submitLoad = true })
      .addCase(submitDonation.fulfilled, (s, a) => {
        s.submitLoad = false
        const donation = a.payload.donation || a.payload
        s.myList.unshift(donation)
      })
      .addCase(submitDonation.rejected,  (s, a) => { s.submitLoad = false; s.error = a.payload })

    // All donations (manager)
    builder.addCase(fetchAllDonations.fulfilled, (s, a) => {
      s.allList = a.payload.donations || a.payload
    })

    // Pending count
    builder.addCase(fetchPendingCount.fulfilled, (s, a) => {
      s.pendingCount = a.payload
    })

    // Analytics — Backend: { success, data: { totals:[{_id,count,total}], monthly:[...] } }
    builder
      .addCase(fetchAnalytics.pending,   (s) => { s.analyticsLoad = true })
      .addCase(fetchAnalytics.fulfilled, (s, a) => {
        s.analyticsLoad = false
        s.analytics = a.payload?.data ?? a.payload   // { totals, monthly } extract
      })
      .addCase(fetchAnalytics.rejected,  (s, a) => { s.analyticsLoad = false })

    // Approve
    builder.addCase(approveDonation.fulfilled, (s, a) => {
      const updated = a.payload.donation || a.payload?.data || a.payload
      const idx = s.allList.findIndex((d) => d._id === updated._id)
      if (idx !== -1) s.allList[idx] = updated
      s.pendingCount = Math.max(0, s.pendingCount - 1)
    })

    // Reject
    builder.addCase(rejectDonation.fulfilled, (s, a) => {
      const updated = a.payload.donation || a.payload?.data || a.payload
      const idx = s.allList.findIndex((d) => d._id === updated._id)
      if (idx !== -1) s.allList[idx] = updated
      s.pendingCount = Math.max(0, s.pendingCount - 1)
    })
  },
})

export const { socketNewDonation, socketDonationUpdated, setPendingCount } = donationSlice.actions

export const selectMyDonations   = (s) => s.donations.myList
export const selectAllDonations  = (s) => s.donations.allList
export const selectLeaderboard   = (s) => s.donations.leaderboard
export const selectAnalytics     = (s) => s.donations.analytics
export const selectPendingCount  = (s) => s.donations.pendingCount
export const selectDonationLoad  = (s) => s.donations.loading
export const selectSubmitLoad    = (s) => s.donations.submitLoad
export const selectAnalyticsLoad = (s) => s.donations.analyticsLoad   // ← এখন state এ আছে, crash নেই

export default donationSlice.reducer