import api from './api'

const postService = {
  // ১. নিউজফিড (সব ইউজারের পোস্ট - নতুন যোগ করা হয়েছে)
  feed:          (page = 1)      => api.get(`/posts/feed?page=${page}&limit=10`),

  // ২. টাইমলাইন (বন্ধু + নিজের পোস্ট)
  timeline:      (page = 1)      => api.get(`/posts/timeline?page=${page}`),
  
  userPosts:     (userId, page = 1) => api.get(`/posts/user/${userId}?page=${page}`),
  create:        (data)          => api.post('/posts', data),
  getById:       (id)            => api.get(`/posts/${id}`),
  update:        (id, data)      => api.put(`/posts/${id}`, data),
  remove:        (id)            => api.delete(`/posts/${id}`),
  like:          (id)            => api.post(`/posts/${id}/like`),
  comment:       (id, data)      => api.post(`/posts/${id}/comment`, data),
  deleteComment: (postId, commentId) =>
    api.delete(`/posts/${postId}/comment/${commentId}`),
}

export default postService