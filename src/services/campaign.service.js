import api from './api'

const campaignService = {
  // Public
  getAll:      (params) => api.get('/campaigns', { params }),
  getById:     (id)     => api.get(`/campaigns/${id}`),

  // Manager/Admin
  create:      (data)   => api.post('/campaigns', data),
  update:      (id, data) => api.put(`/campaigns/${id}`, data),
  remove:      (id)     => api.delete(`/campaigns/${id}`),
  uploadCover: (id, formData) =>
    api.post(`/campaigns/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default campaignService
