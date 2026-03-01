import api from './api';

const postService = {
  feed:          (page = 1)         => api.get(`/posts/feed?page=${page}&limit=10`),
  timeline:      (page = 1)         => api.get(`/posts/timeline?page=${page}`),
  userPosts:     (userId, page = 1) => api.get(`/posts/user/${userId}?page=${page}`),
  create:        (data)             => api.post('/posts', data),
  getById:       (id)               => api.get(`/posts/${id}`),
  update:        (id, data)         => api.put(`/posts/${id}`, data),
  remove:        (id)               => api.delete(`/posts/${id}`),
  view:           (id)              => api.post(`/posts/${id}/view`),

  // Comments
  comment:       (id, data)         => api.post(`/posts/${id}/comment`, data),
  deleteComment: (postId, cId)      => api.delete(`/posts/${postId}/comment/${cId}`),

  // NEW: Replies
  addReply:    (postId, commentId, data)          => api.post(`/posts/${postId}/comment/${commentId}/reply`, data),
  deleteReply: (postId, commentId, replyId)       => api.delete(`/posts/${postId}/comment/${commentId}/reply/${replyId}`),
};

export default postService;