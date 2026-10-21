import client from './client'

export const configApi = {
  get: () => client.get('/config').then((r) => r.data.data),
  setMaintenance: (maintenanceMode) => client.put('/config/maintenance', { maintenanceMode }).then((r) => r.data.data),
}
