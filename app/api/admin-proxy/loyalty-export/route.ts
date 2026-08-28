import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// The CSV lives behind the admin bearer token, which a plain <a download>
// cannot carry. This proxies the download with the session's token so the
// button in the UI is a normal link.
export async function GET() {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/loyalty/export/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  if (!res.ok) {
    return NextResponse.json({ detail: 'Kunne ikke hente eksporten.' }, { status: res.status })
  }
  return new NextResponse(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'text/csv; charset=utf-8',
      'Content-Disposition':
        res.headers.get('content-disposition') ?? 'attachment; filename="kundeklubb.csv"',
    },
  })
}
