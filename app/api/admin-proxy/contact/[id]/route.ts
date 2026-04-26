import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getToken() {
  const session = await auth()
  return (session as any)?.accessToken as string | undefined
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  const res = await fetch(`${API}/api/admin/contact/${id}/`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  const res = await fetch(`${API}/api/admin/contact/${id}/`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return new NextResponse(null, { status: res.status })
}
