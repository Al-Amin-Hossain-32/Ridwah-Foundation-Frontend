import api from './api'

const bookService = {
  // Public
  getAll:      (params)   => api.get('/books', { params }),
  getById:     (id)       => api.get(`/books/${id}`),

  // User — reviews
  addReview:    (id, data) => api.post(`/books/${id}/review`, data),
  updateReview: (id, data) => api.put(`/books/${id}/review`, data),
  deleteReview: (id)       => api.delete(`/books/${id}/review`),

  // Librarian/Admin
  create:      (data)     => api.post('/books', data),
  update:      (id, data) => api.put(`/books/${id}`, data),
  remove:      (id)       => api.delete(`/books/${id}`),
  uploadCover: (id, fd)   =>
    api.post(`/books/${id}/cover`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadFile:  (id, fd)   =>
    api.post(`/books/${id}/file`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default bookService
