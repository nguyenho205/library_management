import client from './client'

export const borrowApi = {
  borrow: (bookId, requestedDueDate) =>
    client.post('/borrow', { bookId, requestedDueDate }).then((r) => r.data.data),
  giveBack: (recordId, returnData) => client.post(`/borrow/${recordId}/return`, returnData).then((r) => r.data.data),
  cancel: (recordId) => client.post(`/borrow/${recordId}/cancel`).then((r) => r.data.data),
  history: () => client.get('/borrow/history').then((r) => r.data.data),
  adminAll: (status) =>
    client.get('/borrow/admin/all', { params: status ? { status } : {} }).then((r) => r.data.data),
  approve: (recordId) => client.post(`/borrow/${recordId}/approve`).then((r) => r.data.data),
  reject: (recordId) => client.post(`/borrow/${recordId}/reject`).then((r) => r.data.data),
  sendReminder: (recordId) => client.post(`/borrow/${recordId}/send-reminder`).then((r) => r.data),
  sendDueRemindersBatch: () => client.post('/borrow/admin/send-due-reminders').then((r) => r.data),
}
