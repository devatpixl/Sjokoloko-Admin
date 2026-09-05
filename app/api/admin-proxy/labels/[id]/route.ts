import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const t = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/labels/${id}/`, {
    method: 'DELETE',
    headers: t ? { Authorization: `Bearer ${t}` } : {},
    cache: 'no-store',
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}
