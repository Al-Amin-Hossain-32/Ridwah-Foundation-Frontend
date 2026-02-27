import { configureStore } from '@reduxjs/toolkit'
import authReducer     from './authSlice'
import campaignReducer from './campaignSlice'
import donationReducer from './donationSlice'
import bookReducer     from './bookSlice'
import chatReducer     from './chatSlice'
import postReducer     from './postSlice'
// import friendReducer from './friendSlice';
import friendReducer from "../../modules/friends/friendSlice";
import userProfileReducer from '@/modules/userProfile/userProfileSlice';
/**
 * Redux Store
 * সব slice এখানে register করা আছে
 */
const store = configureStore({
  reducer: {
    auth:      authReducer,
    campaigns: campaignReducer,
    donations: donationReducer,
    books:     bookReducer,
    chat:      chatReducer,
    posts:     postReducer,
    friends: friendReducer,
    userProfile: userProfileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Date objects নিয়ে serializability warning বন্ধ করতে
      serializableCheck: {
        ignoredActions: ['chat/receiveMessage'],
      },
    }),
    devTools: true,
  // devTools: import.meta.env.DEV,
})

export default store
