import client from './client'

export const permissionsApi = {
  listPermissions: () => client.get('/permissions').then((r) => r.data.data),
  listGroups: () => client.get('/permission-groups').then((r) => r.data.data),
  createGroup: (payload) => client.post('/permission-groups', payload).then((r) => r.data.data),
  updateGroup: (id, payload) => client.put(`/permission-groups/${id}`, payload).then((r) => r.data.data),
  removeGroup: (id) => client.delete(`/permission-groups/${id}`).then((r) => r.data),
  listAccounts: (params) => client.get('/accounts', { params }).then((r) => r.data.data),
  assignGroups: (accountId, groupId) =>
    client.put(`/accounts/${accountId}/permission-groups`, { groupId }).then((r) => r.data.data),
}
