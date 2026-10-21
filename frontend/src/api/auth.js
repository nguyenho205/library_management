import client from './client'

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data.data),
  register: (payload) => client.post('/auth/register', payload).then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  verifyEmail: (email, code) => client.post('/auth/verify-email', { email, code }).then((r) => r.data),
  resendVerification: (email) => client.post('/auth/resend-verification', { email }).then((r) => r.data),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (email, code, newPassword) => client.post('/auth/reset-password', { email, code, newPassword }).then((r) => r.data),
  changePassword: (oldPassword, newPassword) => client.post('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
  requestChangeEmail: (newEmail) => client.post('/auth/change-email', { newEmail }).then((r) => r.data),
  confirmChangeEmail: (newEmail, code) => client.post('/auth/confirm-email-change', { newEmail, code }).then((r) => r.data),
}
