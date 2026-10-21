import client from './client'

export const borrowApi = {
  borrow: (bookId) => client.post('/borrow', { bookId }).then((r) => r.data.data),
  giveBack: (recordId) => client.post(`/borrow/${recordId}/return`).then((r) => r.data.data),
  history: () => client.get('/borrow/history').then((r) => r.data.data),
}
