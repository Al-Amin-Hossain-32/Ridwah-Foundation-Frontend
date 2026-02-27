import api from './api'

const userService = {
  getAll:        ()         => api.get('/users/'),
  search:        (q)        => api.get('/users/search', { params: { q } }),
  uploadPicture: (fd)       =>
    api.post('/users/upload-picture', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getById:       (id)       => api.get(`/users/${id}`),
  update:        (id, data) => api.put(`/users/${id}`, data),
  updateDonation:(id, data) => api.put(`/users/${id}/donation`, data),
}

export default userService
