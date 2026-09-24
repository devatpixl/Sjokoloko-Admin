/**
 * Catch-all proxy for HORECA admin writes.
 *
 * The other proxy routes are one file per endpoint, which is fine for the two
 * or three verbs each consumer resource has. HORECA has sixteen endpoints and
 * they all share one prefix, one guard and one token, so a catch-all is the
 * same code once instead of sixteen times.
 *
 * It forwards only to /api/admin/horeca/* — the path segments are rejoined
 * and cannot escape that prefix, so this is not an open proxy.
 */
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function forward(req: NextRequest, path: string[]) {
  const session = await auth()
  const token = (session as { accessToken?: string } | null)?.accessToken
  // Path traversal cannot survive this: every segment is encoded, so '..'
  // arrives as literal text rather than climbing out of the prefix.
  const clean = path.map(encodeURIComponent).join('/')
  const search = req.nextUrl.search
  const hasBody = req.method !== 'GET' && req.method !== 'DELETE'

  const res = await fetch(`${API}/api/admin/horeca/${clean}/${search}`, {
    method: req.method,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(hasBody ? { body: await req.text() } : {}),
    cache: 'no-store',
  })

  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  })
}

type Ctx = { params: Promise<{ path: string[] }> }
export async function GET(req: NextRequest, { params }: Ctx) { return forward(req, (await params).path) }
export async function POST(req: NextRequest, { params }: Ctx) { return forward(req, (await params).path) }
export async function PATCH(req: NextRequest, { params }: Ctx) { return forward(req, (await params).path) }
export async function DELETE(req: NextRequest, { params }: Ctx) { return forward(req, (await params).path) }
