import client from './client'

export const booksApi = {
  search: (params) => client.get('/books', { params }).then((r) => r.data.data),
  create: (payload) => client.post('/books', payload).then((r) => r.data.data),
  update: (id, payload) => client.put(`/books/${id}`, payload).then((r) => r.data.data),
  discontinue: (id) => client.put(`/books/${id}/discontinue`).then((r) => r.data.data),
  restore: (id) => client.put(`/books/${id}/restore`).then((r) => r.data.data),
  remove: (id) => client.delete(`/books/${id}`).then((r) => r.data),
  importCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/books/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
}
