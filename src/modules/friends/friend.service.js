import api from '@/services/api';

/**
 * Friend API Service Layer
 * সমস্ত API call এক জায়গায় — mock করা সহজ হয়
 */
const friendService = {
  getFriends:     ()       => api.get('/friends'),
  getSuggestions: ()       => api.get('/friends/suggestions'),
  getRequests:    ()       => api.get('/friends/requests'),
  getStatus:      (userId) => api.get(`/friends/status/${userId}`),
  sendRequest:    (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest:  (id)     => api.put(`/friends/accept/${id}`),
  rejectRequest:  (id)     => api.put(`/friends/reject/${id}`),
  removeFriend:   (id)     => api.delete(`/friends/${id}`),
};

export default friendService;