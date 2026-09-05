import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** Buys the shipping label for an order. Cannot be undone: Profrakt has no
 *  cancel endpoint, so the UI confirms before calling this. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/orders/${orderNumber}/label/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
