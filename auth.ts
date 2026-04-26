import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-post', type: 'email' },
        password: { label: 'Passord', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            cache: 'no-store',
          })
          if (!res.ok) return null
          const data = await res.json()
          if (!data.user?.is_admin) return null
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            isAdmin: data.user.is_admin,
            accessToken: data.access,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).isAdmin = token.isAdmin
      }
      ;(session as any).accessToken = token.accessToken
      return session
    },
  },
})
