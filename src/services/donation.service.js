import api from './api'

const donationService = {
  // Guest/User
  create:      (data)   => api.post('/donations', data),
  uploadProof: (id, fd) =>
    api.post(`/donations/${id}/proof`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  leaderboard: ()       => api.get('/donations/leaderboard'),

  // Logged user
  myDonations: ()       => api.get('/donations/my'),

  // Admin/Manager
  getAll:      (params) => api.get('/donations', { params }),
  analytics:   ()       => api.get('/donations/analytics'),
  getById:     (id)     => api.get(`/donations/${id}`),
  approve:     (id)     => api.patch(`/donations/${id}/approve`),
  reject:      (id, reason) => api.patch(`/donations/${id}/reject`, { reason }),
}

export default donationService
