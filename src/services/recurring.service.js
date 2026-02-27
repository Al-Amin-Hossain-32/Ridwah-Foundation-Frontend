import api from './api'

const recurringService = {
  // User
  create:  (data) => api.post('/recurring-donations', data),
  my:      ()     => api.get('/recurring-donations/my'),
  pause:   (id)   => api.patch(`/recurring-donations/${id}/pause`),
  resume:  (id)   => api.patch(`/recurring-donations/${id}/resume`),
  cancel:  (id)   => api.patch(`/recurring-donations/${id}/cancel`),
  pay:     (id)   => api.post(`/recurring-donations/${id}/pay`),

  // Admin/Manager
  getAll:  ()     => api.get('/recurring-donations'),
  overdue: ()     => api.get('/recurring-donations/overdue'),
}

export default recurringService
