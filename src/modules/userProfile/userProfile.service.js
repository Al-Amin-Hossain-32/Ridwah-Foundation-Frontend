import api from '@/services/api';

const userProfileService = {
  // existing /api/users/:id endpoint ব্যবহার করছি
   getProfile: (userId) => {
    console.log('📡 API call to:', `/users/${userId}`); // ← যুক্ত করুন
    return api.get(`/users/${userId}`);
  },

  // আপনার নতুন routes
  getPosts:   (userId, page = 1) =>
    api.get(`/users/${userId}/posts?page=${page}`),
  getFriends: (userId, page = 1) =>
    api.get(`/users/${userId}/friends?page=${page}`),

  // message send করে conversation খুলি
  getOrCreateConversation: (userId) =>
    api.post('/messages', {
      receiverId: userId,
      content: '👋',
    }),
};

export default userProfileService;