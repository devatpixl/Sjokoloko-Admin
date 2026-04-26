import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const qs = req.nextUrl.searchParams.toString()
  const res = await fetch(`${API}/api/admin/contact/${qs ? `?${qs}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
