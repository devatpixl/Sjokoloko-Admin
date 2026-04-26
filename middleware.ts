import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: false,
  })

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (!token.isAdmin) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api/auth|api/debug-token|_next/static|_next/image|favicon.ico).*)'],
}
