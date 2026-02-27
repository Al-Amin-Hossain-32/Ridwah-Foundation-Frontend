import api from './api'

const friendService = {
  suggestions: ()       => api.get('/friends/suggestions'),
  requests:    ()       => api.get('/friends/requests'),
  list:        ()       => api.get('/friends'),
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  accept:      (id)     => api.put(`/friends/accept/${id}`),
  reject:      (id)     => api.put(`/friends/reject/${id}`),
  remove:      (friendId) => api.delete(`/friends/${friendId}`),
}

export default friendService
