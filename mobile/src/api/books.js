import client from './client'

export const booksApi = {
  search: (params = {}) => client.get('/books', { params }).then((res) => res.data.data),
  get: (id) => client.get(`/books/${id}`).then((res) => res.data.data),
  getRecommendations: (tab = 'CATEGORY', limit = 6) =>
    client.get('/books/recommendations', { params: { tab, limit } }).then((res) => res.data.data),
  getCategories: () => client.get('/categories').then((res) => res.data.data),
}
