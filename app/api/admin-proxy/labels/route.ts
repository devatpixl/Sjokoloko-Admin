import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function token() {
  const session = await auth()
  return (session as any)?.accessToken as string | undefined
}

export async function GET() {
  const t = await token()
  const res = await fetch(`${API}/api/admin/labels/`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
    cache: 'no-store',
  })
  return NextResponse.json(await res.json().catch(() => []), { status: res.status })
}

export async function POST(req: NextRequest) {
  const t = await token()
  const res = await fetch(`${API}/api/admin/labels/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify(await req.json()),
    cache: 'no-store',
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}
