import client from './client'

export const membersApi = {
  getCard: () => client.get('/members/me/card').then((res) => res.data.data),
}
