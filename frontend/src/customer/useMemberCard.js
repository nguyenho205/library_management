import { useEffect, useState } from 'react'
import { membersApi } from '../api/members'

export default function useMemberCard(enabled = true) {
  const [card, setCard] = useState(null)

  useEffect(() => {
    if (!enabled) return
    let mounted = true
    membersApi.getCard().then((data) => {
      if (mounted) setCard(data)
    }).catch(() => {})
    return () => { mounted = false }
  }, [enabled])

  return card
}
