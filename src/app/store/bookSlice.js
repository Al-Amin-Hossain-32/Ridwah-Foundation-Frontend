import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import bookService from '@/services/book.service'
import bookRequestService from '@/services/bookRequest.service'

// ─── Books ────────────────────────────────────────────────────
export const fetchBooks = createAsyncThunk(
  'books/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await bookService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchBookById = createAsyncThunk(
  'books/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await bookService.getById(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ─── Book Requests ────────────────────────────────────────────
export const fetchMyRequests = createAsyncThunk(
  'books/myRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await bookRequestService.my()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const requestBook = createAsyncThunk(
  'books/request',
  async (data, { rejectWithValue }) => {
    try {
      const res = await bookRequestService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────
const bookSlice = createSlice({
  name: 'books',
  initialState: {
    list:       [],
    selected:   null,
    myRequests: [],
    loading:    false,
    error:      null,
  },
  reducers: {
    clearSelectedBook(state) { state.selected = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending,   (s) => { s.loading = true })
      .addCase(fetchBooks.fulfilled, (s, a) => {
        s.loading = false
        s.list    = a.payload.books || a.payload
      })
      .addCase(fetchBooks.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    builder
      .addCase(fetchBookById.fulfilled, (s, a) => {
        s.selected = a.payload.book || a.payload
      })

    builder
      .addCase(fetchMyRequests.fulfilled, (s, a) => {
        s.myRequests = a.payload.requests || a.payload
      })

    builder
      .addCase(requestBook.fulfilled, (s, a) => {
        const req = a.payload.request || a.payload
        s.myRequests.unshift(req)
      })
  },
})

export const { clearSelectedBook } = bookSlice.actions

export const selectBooks      = (s) => s.books.list
export const selectBook       = (s) => s.books.selected
export const selectMyRequests = (s) => s.books.myRequests
export const selectBookLoad   = (s) => s.books.loading

export default bookSlice.reducer
