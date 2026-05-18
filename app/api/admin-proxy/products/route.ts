import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getToken() {
  const session = await auth()
  return (session as any)?.accessToken as string | undefined
}

export async function GET(req: NextRequest) {
  const token = await getToken()
  const qs = req.nextUrl.searchParams.toString()
  const res = await fetch(`${API}/api/admin/products/${qs ? `?${qs}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ([]))
  return NextResponse.json(data, { status: res.status })
}
