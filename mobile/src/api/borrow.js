import client from './client'

export const borrowApi = {
  borrow: (bookId, requestedDueDate) =>
    client.post('/borrow', { bookId, requestedDueDate }).then((res) => res.data.data),

  history: () => client.get('/borrow/history').then((res) => res.data.data),

  cancel: (recordId) => client.post(`/borrow/${recordId}/cancel`).then((res) => res.data.data),
}

