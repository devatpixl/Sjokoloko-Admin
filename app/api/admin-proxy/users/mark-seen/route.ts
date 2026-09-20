import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Dismisses the "nye kunder" badge on Kunder. A static segment wins over the
// sibling [id] route, so this never arrives at the API as a user id.
export async function POST() {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/users/mark-seen/`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: '{}',
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
