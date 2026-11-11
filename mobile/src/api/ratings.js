import client from './client'

export const ratingsApi = {
  forBook: (bookId) => client.get(`/books/${bookId}/ratings`).then((res) => res.data.data),
  mine: () => client.get('/book-ratings/mine').then((res) => res.data.data || []),
  save: (bookId, payload) => client.post(`/books/${bookId}/ratings`, payload).then((res) => res.data.data),
}
