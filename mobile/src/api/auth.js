import client from './client'

export const authApi = {
  login: (email, password) =>
    client.post('/auth/login', { email, password }).then((res) => res.data.data),

  register: (payload) =>
    client.post('/auth/register', payload).then((res) => res.data.data),

  logout: () => client.post('/auth/logout').then((res) => res.data),

  changePassword: (oldPassword, newPassword) =>
    client.post('/auth/change-password', { oldPassword, newPassword }).then((res) => res.data),

  forgotPassword: (email) =>
    client.post('/auth/forgot-password', { email }).then((res) => res.data),

  me: () => client.get('/auth/me').then((res) => res.data.data),
}

