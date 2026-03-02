import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import campaignService from '@/services/campaign.service'

// ─── Async Thunks ─────────────────────────────────────────────────────────────

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

// ─── Slice ────────────────────────────────────────────────────────────────────

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

    // ── Socket: donation approve হলে campaign progress realtime update ────────
    socketCampaignProgressUpdated(state, action) {
      // payload: { campaignId, currentAmount, status, progressPercentage }
      const { campaignId, currentAmount, status, progressPercentage } = action.payload

      // list-এ update
      const idx = state.list.findIndex((c) => c._id === campaignId)
      if (idx !== -1) {
        state.list[idx] = {
          ...state.list[idx],
          currentAmount,
          status,
          progressPercentage,
        }
      }

      // selected campaign (detail page-এ আছে) update
      if (state.selected?._id === campaignId) {
        state.selected = {
          ...state.selected,
          currentAmount,
          status,
          progressPercentage,
        }
      }
    },

    // ── Socket: campaign create/update/delete ─────────────────────────────────
    socketCampaignCreated(state, action) {
      state.list.unshift(action.payload)
    },
    socketCampaignUpdated(state, action) {
      const updated = action.payload
      const idx = state.list.findIndex((c) => c._id === updated._id)
      if (idx !== -1) state.list[idx] = updated
      if (state.selected?._id === updated._id) state.selected = updated
    },
    socketCampaignDeleted(state, action) {
      // payload: campaignId
      state.list = state.list.filter((c) => c._id !== action.payload)
      if (state.selected?._id === action.payload) state.selected = null
    },
  },

  extraReducers: (builder) => {
    // Fetch All — Backend: { success, campaigns, pagination }
    builder
      .addCase(fetchCampaigns.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(fetchCampaigns.fulfilled, (s, a) => {
        s.loading = false
        const p = a.payload
        s.list  = Array.isArray(p) ? p
                : Array.isArray(p?.campaigns) ? p.campaigns
                : Array.isArray(p?.data)      ? p.data
                : []
        s.total = p?.pagination?.total || p?.total || s.list.length
      })
      .addCase(fetchCampaigns.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    // Fetch By ID — Backend: { success, data: { campaign, recentDonations } }
    builder
      .addCase(fetchCampaignById.pending,   (s) => { s.detailLoad = true; s.error = null })
      .addCase(fetchCampaignById.fulfilled, (s, a) => {
        s.detailLoad = false
        const p = a.payload
        // service returns { campaign, recentDonations } nested in data
        s.selected = p?.data?.campaign || p?.campaign || p?.data || p
      })
      .addCase(fetchCampaignById.rejected,  (s, a) => { s.detailLoad = false; s.error = a.payload })

    // Create — Backend: { success, data: campaign }
    builder.addCase(createCampaign.fulfilled, (s, a) => {
      const campaign = a.payload?.data || a.payload?.campaign || a.payload
      if (campaign?._id) s.list.unshift(campaign)
    })

    // Update — Backend: { success, data: campaign }
    builder.addCase(updateCampaign.fulfilled, (s, a) => {
      const updated = a.payload?.data || a.payload?.campaign || a.payload
      if (!updated?._id) return
      const idx = s.list.findIndex((c) => c._id === updated._id)
      if (idx !== -1) s.list[idx] = updated
      if (s.selected?._id === updated._id) s.selected = updated
    })

    // Delete
    builder.addCase(deleteCampaign.fulfilled, (s, a) => {
      s.list = s.list.filter((c) => c._id !== a.payload)
    })
  },
})

// ─── Actions ─────────────────────────────────────────────────────────────────
export const {
  clearSelected,
  socketCampaignProgressUpdated,
  socketCampaignCreated,
  socketCampaignUpdated,
  socketCampaignDeleted,
} = campaignSlice.actions

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCampaigns    = (s) => s.campaigns.list
export const selectCampaignById = (s) => s.campaigns.selected
export const selectCampaignLoad = (s) => s.campaigns.loading

export default campaignSlice.reducer