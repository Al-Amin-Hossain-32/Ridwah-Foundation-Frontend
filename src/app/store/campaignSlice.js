import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import campaignService from '@/services/campaign.service'

// ─── Async Thunks ─────────────────────────────────────────────

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await campaignService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchCampaignById = createAsyncThunk(
  'campaigns/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await campaignService.getById(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const createCampaign = createAsyncThunk(
  'campaigns/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await campaignService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateCampaign = createAsyncThunk(
  'campaigns/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await campaignService.update(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const deleteCampaign = createAsyncThunk(
  'campaigns/delete',
  async (id, { rejectWithValue }) => {
    try {
      await campaignService.remove(id)
      return id
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ─── Slice ───────────────────────────────────────────────────
const campaignSlice = createSlice({
  name: 'campaigns',
  initialState: {
    list:       [],
    total:      0,
    selected:   null,
    loading:    false,
    detailLoad: false,
    error:      null,
  },
  reducers: {
    clearSelected(state) {
      state.selected = null
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true; state.error = null
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false
        state.list    = action.payload.campaigns || action.payload
        state.total   = action.payload.total || state.list.length
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false; state.error = action.payload
      })

    // Fetch By ID
    builder
      .addCase(fetchCampaignById.pending, (state) => {
        state.detailLoad = true; state.error = null
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.detailLoad = false
        state.selected   = action.payload.campaign || action.payload
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.detailLoad = false; state.error = action.payload
      })

    // Create
    builder.addCase(createCampaign.fulfilled, (state, action) => {
      const campaign = action.payload.campaign || action.payload
      state.list.unshift(campaign)
    })

    // Update
    builder.addCase(updateCampaign.fulfilled, (state, action) => {
      const updated = action.payload.campaign || action.payload
      const idx = state.list.findIndex((c) => c._id === updated._id)
      if (idx !== -1) state.list[idx] = updated
      if (state.selected?._id === updated._id) state.selected = updated
    })

    // Delete
    builder.addCase(deleteCampaign.fulfilled, (state, action) => {
      state.list = state.list.filter((c) => c._id !== action.payload)
    })
  },
})

export const { clearSelected } = campaignSlice.actions

// Selectors
export const selectCampaigns    = (state) => state.campaigns.list
export const selectCampaignById = (state) => state.campaigns.selected
export const selectCampaignLoad = (state) => state.campaigns.loading

export default campaignSlice.reducer
