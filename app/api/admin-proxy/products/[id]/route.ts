import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getToken() {
  const session = await auth()
  return (session as any)?.accessToken as string | undefined
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  const res = await fetch(`${API}/api/admin/products/${id}/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  const formData = await req.formData()
  const res = await fetch(`${API}/api/admin/products/${id}/`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  const res = await fetch(`${API}/api/admin/products/${id}/`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  // 204 carries no body. Anything else may carry the reason the delete was
  // refused — notably the 409 raised when the product appears on an order —
  // and swallowing it is what left the UI showing a bare "Kunne ikke slette".
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}
