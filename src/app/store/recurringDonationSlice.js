import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import recurringService from '@/services/recurring.service'

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC THUNKS
// ═══════════════════════════════════════════════════════════════════════════════

// ── User ──────────────────────────────────────────────────────────────────────
export const createRecurring = createAsyncThunk(
  'recurring/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await recurringService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchMyRecurring = createAsyncThunk(
  'recurring/fetchMy',
  async (params, { rejectWithValue }) => {
    try {
      const res = await recurringService.my(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const pauseRecurring = createAsyncThunk(
  'recurring/pause',
  async (id, { rejectWithValue }) => {
    try {
      const res = await recurringService.pause(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const resumeRecurring = createAsyncThunk(
  'recurring/resume',
  async (id, { rejectWithValue }) => {
    try {
      const res = await recurringService.resume(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const cancelRecurring = createAsyncThunk(
  'recurring/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const res = await recurringService.cancel(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const makeRecurringPayment = createAsyncThunk(
  'recurring/pay',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await recurringService.pay(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// ── Manager / Admin ───────────────────────────────────────────────────────────
export const fetchAllRecurring = createAsyncThunk(
  'recurring/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await recurringService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchOverdueRecurring = createAsyncThunk(
  'recurring/fetchOverdue',
  async (_, { rejectWithValue }) => {
    try {
      const res = await recurringService.overdue()
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: update a record in a list
// ═══════════════════════════════════════════════════════════════════════════════
const updateInList = (list, updated) => {
  const idx = list.findIndex((r) => r._id === updated._id)
  if (idx !== -1) list[idx] = updated
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════════════════════
const recurringSlice = createSlice({
  name: 'recurring',
  initialState: {
    myList:    [],   // logged-in user এর subscriptions
    allList:   [],   // manager view
    overdue:   [],   // overdue subscriptions
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    loading:   false,
    actionLoad: false, // pause/resume/cancel/pay loading
    error:     null,
  },

  reducers: {
    clearError(state) { state.error = null },
  },

  extraReducers: (builder) => {
    // ── Create ────────────────────────────────────────────────────────────────
    builder
      .addCase(createRecurring.pending,   (s) => { s.actionLoad = true })
      .addCase(createRecurring.fulfilled, (s, a) => {
        s.actionLoad = false
        const rec = a.payload.data || a.payload
        s.myList.unshift(rec)
      })
      .addCase(createRecurring.rejected, (s, a) => { s.actionLoad = false; s.error = a.payload })

    // ── Fetch My ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchMyRecurring.pending,   (s) => { s.loading = true })
      .addCase(fetchMyRecurring.fulfilled, (s, a) => {
        s.loading = false
        s.myList  = a.payload.data || a.payload
      })
      .addCase(fetchMyRecurring.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    // ── Pause ─────────────────────────────────────────────────────────────────
    builder
      .addCase(pauseRecurring.pending,   (s) => { s.actionLoad = true })
      .addCase(pauseRecurring.fulfilled, (s, a) => {
        s.actionLoad = false
        const updated = a.payload.data || a.payload
        updateInList(s.myList, updated)
        updateInList(s.allList, updated)
      })
      .addCase(pauseRecurring.rejected,  (s, a) => { s.actionLoad = false; s.error = a.payload })

    // ── Resume ────────────────────────────────────────────────────────────────
    builder
      .addCase(resumeRecurring.pending,   (s) => { s.actionLoad = true })
      .addCase(resumeRecurring.fulfilled, (s, a) => {
        s.actionLoad = false
        const updated = a.payload.data || a.payload
        updateInList(s.myList, updated)
        updateInList(s.allList, updated)
      })
      .addCase(resumeRecurring.rejected,  (s, a) => { s.actionLoad = false; s.error = a.payload })

    // ── Cancel ────────────────────────────────────────────────────────────────
    builder
      .addCase(cancelRecurring.pending,   (s) => { s.actionLoad = true })
      .addCase(cancelRecurring.fulfilled, (s, a) => {
        s.actionLoad = false
        const updated = a.payload.data || a.payload
        updateInList(s.myList, updated)
        updateInList(s.allList, updated)
        // overdue থেকে সরাও
        s.overdue = s.overdue.filter((r) => r._id !== updated._id)
      })
      .addCase(cancelRecurring.rejected,  (s, a) => { s.actionLoad = false; s.error = a.payload })

    // ── Pay ───────────────────────────────────────────────────────────────────
    builder
      .addCase(makeRecurringPayment.pending,   (s) => { s.actionLoad = true })
      .addCase(makeRecurringPayment.fulfilled, (s, a) => {
        s.actionLoad = false
        // payment submitted — overdue list থেকে সরানো হয় না, manager approve করলে হবে
      })
      .addCase(makeRecurringPayment.rejected,  (s, a) => { s.actionLoad = false; s.error = a.payload })

    // ── Fetch All (manager) ───────────────────────────────────────────────────
    builder
      .addCase(fetchAllRecurring.pending,   (s) => { s.loading = true })
      .addCase(fetchAllRecurring.fulfilled, (s, a) => {
        s.loading   = false
        s.allList   = a.payload.recurring || a.payload.data || a.payload
        s.pagination = a.payload.pagination || s.pagination
      })
      .addCase(fetchAllRecurring.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    // ── Overdue ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchOverdueRecurring.fulfilled, (s, a) => {
        s.overdue = a.payload.data || a.payload
      })
  },
})

export const { clearError } = recurringSlice.actions

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectMyRecurring    = (s) => s.recurring.myList
export const selectAllRecurring   = (s) => s.recurring.allList
export const selectOverdue        = (s) => s.recurring.overdue
export const selectRecurringLoad  = (s) => s.recurring.loading
export const selectRecurringAction = (s) => s.recurring.actionLoad
export const selectRecurringPagination = (s) => s.recurring.pagination

export default recurringSlice.reducer