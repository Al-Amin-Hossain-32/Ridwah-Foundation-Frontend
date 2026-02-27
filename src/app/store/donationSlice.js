import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import donationService from '@/services/donation.service'

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

// Admin thunks
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

const donationSlice = createSlice({
  name: 'donations',
  initialState: {
    myList:      [],
    allList:     [],
    leaderboard: [],
    loading:     false,
    submitLoad:  false,
    error:       null,
  },
  reducers: {},
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
    builder
      .addCase(fetchLeaderboard.fulfilled, (s, a) => {
        s.leaderboard = a.payload.leaderboard || a.payload
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

    // All (admin)
    builder
      .addCase(fetchAllDonations.fulfilled, (s, a) => {
        s.allList = a.payload.donations || a.payload
      })

    // Approve
    builder.addCase(approveDonation.fulfilled, (s, a) => {
      const updated = a.payload.donation || a.payload
      const idx = s.allList.findIndex((d) => d._id === updated._id)
      if (idx !== -1) s.allList[idx] = updated
    })

    // Reject
    builder.addCase(rejectDonation.fulfilled, (s, a) => {
      const updated = a.payload.donation || a.payload
      const idx = s.allList.findIndex((d) => d._id === updated._id)
      if (idx !== -1) s.allList[idx] = updated
    })
  },
})

export const selectMyDonations  = (s) => s.donations.myList
export const selectAllDonations = (s) => s.donations.allList
export const selectLeaderboard  = (s) => s.donations.leaderboard
export const selectDonationLoad = (s) => s.donations.loading
export const selectSubmitLoad   = (s) => s.donations.submitLoad

export default donationSlice.reducer
