'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

/**
 * The only thing that clears the new-customer badge.
 *
 * Viewing the list deliberately leaves the count alone — ops asked for a
 * notification that survives a glance at the page — so dismissing it is an
 * explicit press, never a side effect of navigation.
 */
export default function MarkSeenButton({ count }: { count: number }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState(false)

  if (count < 1) return null

  async function handleClear() {
    setPending(true)
    try {
      const res = await fetch('/api/admin-proxy/users/mark-seen', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(
        count === 1 ? '1 ny kunde merket som sett' : `${count} nye kunder merket som sett`,
      )
      // Clears the sidebar badge now instead of on its next 30s poll.
      window.dispatchEvent(new Event('admin:stats-changed'))
      router.refresh()
    } catch {
      toast.error('Kunne ikke merke kundene som sett')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={pending}
      className="admin-btn admin-btn-secondary"
    >
      {pending
        ? 'Merker …'
        : `Merk ${count} ${count === 1 ? 'ny kunde' : 'nye kunder'} som sett`}
    </button>
  )
}
