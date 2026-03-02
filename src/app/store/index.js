import { configureStore } from '@reduxjs/toolkit'
import authReducer          from './authSlice'
import campaignReducer      from './campaignSlice'
import donationReducer      from './donationSlice'
import recurringReducer     from './recurringDonationSlice'  // ← আগে missing ছিল
import bookReducer          from './bookSlice'
import chatReducer          from './chatSlice'
import postReducer          from './postSlice'
import friendReducer        from '../../modules/friends/friendSlice'
import userProfileReducer   from '../../modules/userProfile/userProfileSlice'
import notificationReducer  from './notificationSlice'

const store = configureStore({
  reducer: {
    auth:          authReducer,
    campaigns:     campaignReducer,
    donations:     donationReducer,
    recurring:     recurringReducer,
    books:         bookReducer,
    chat:          chatReducer,
    posts:         postReducer,
    friends:       friendReducer,
    userProfile:   userProfileReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { ignoredActions: ['chat/receiveMessage'] },
    }),
  devTools: import.meta.env.DEV,
})

export default store