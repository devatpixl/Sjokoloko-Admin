import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === 'https:',
  })
  return NextResponse.json({
    hasToken: !!token,
    token,
    cookieNames: req.cookies.getAll().map(c => c.name),
  })
}
