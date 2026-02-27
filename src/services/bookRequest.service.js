import api from './api'

const bookRequestService = {
  // User
  create:  (data) => api.post('/book-requests', data),
  my:      ()     => api.get('/book-requests/my'),
  cancel:  (id)   => api.patch(`/book-requests/${id}/cancel`),

  // Librarian/Admin
  getAll:    (params) => api.get('/book-requests', { params }),
  waitlist:  (bookId) => api.get(`/book-requests/waitlist/${bookId}`),
  approve:   (id)     => api.patch(`/book-requests/${id}/approve`),
  reject:    (id)     => api.patch(`/book-requests/${id}/reject`),
  issue:     (id)     => api.patch(`/book-requests/${id}/issue`),
  returnBook:(id)     => api.patch(`/book-requests/${id}/return`),
}

export default bookRequestService
