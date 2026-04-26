import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET() {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/stats/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
