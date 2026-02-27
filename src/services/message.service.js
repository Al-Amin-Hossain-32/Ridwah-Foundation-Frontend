import api from './api';

const messageService = {
  unreadCount:          ()             => api.get('/messages/unread/count'),
  conversations:        ()             => api.get('/messages/conversations'),
  markConversationRead: (id)           => api.put(`/messages/conversations/${id}/read`),
  send:                 (data)         => api.post('/messages', data),
  getMessages:          (conversationId, params) => api.get(`/messages/${conversationId}`, { params }),
  update:               (id, data)     => api.put(`/messages/${id}`, data),
  // ⚠️ axios.delete does not natively support body — must pass as { data: ... }
  remove:               (id, body)     => api.delete(`/messages/${id}`, { data: body }),
  history:              (id)           => api.get(`/messages/${id}/history`),
  markRead:             (id)           => api.put(`/messages/${id}/read`),
};

export default messageService;