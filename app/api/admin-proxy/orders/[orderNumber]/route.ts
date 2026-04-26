import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getToken() {
  const session = await auth()
  return (session as any)?.accessToken as string | undefined
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const token = await getToken()
  const res = await fetch(`${API}/api/admin/orders/${orderNumber}/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const token = await getToken()
  const body = await req.json()
  const res = await fetch(`${API}/api/admin/orders/${orderNumber}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const token = await getToken()
  const res = await fetch(`${API}/api/admin/orders/${orderNumber}/`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return new NextResponse(null, { status: res.status })
}
