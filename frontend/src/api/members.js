import client from './client'

export const membersApi = {
  search: (params) => client.get('/members', { params }).then((r) => r.data.data),
  create: (payload) => client.post('/members', payload).then((r) => r.data.data),
  update: (id, payload) => client.put(`/members/${id}`, payload).then((r) => r.data.data),
  lock: (id) => client.put(`/members/${id}/lock`).then((r) => r.data.data),
  unlock: (id) => client.put(`/members/${id}/unlock`).then((r) => r.data.data),
  remove: (id) => client.delete(`/members/${id}`).then((r) => r.data),
}
