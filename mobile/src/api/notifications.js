import client from './client'

export const notificationsApi = {
  list: () => client.get('/notifications').then((res) => res.data.data || []),
  unreadCount: () => client.get('/notifications/unread-count').then((res) => res.data.data?.count || 0),
  markRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch('/notifications/read-all'),
}
