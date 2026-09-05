'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(
    params.get('error') === 'unauthorized'
      ? 'Denne kontoen har ikke admintilgang.'
      : params.get('error') === 'CredentialsSignin'
        ? 'Feil e-post eller passord.'
        : params.get('expired') === '1'
          ? 'Innloggingen din er utløpt. Logg inn på nytt for å fortsette.'
          : ''
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setIsPending(true)
    setError('')
    const res = await signIn('credentials', {
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      redirect: false,
      callbackUrl: '/dashboard',
    })
    if (res?.error || res?.ok === false) {
      setError('Feil e-post eller passord.')
      setIsPending(false)
      return
    }
    // Hard navigation so middleware reads the fresh cookie
    window.location.href = '/dashboard'
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F4F6F8',
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="login-card" style={{
        background: '#fff',
        border: '1px solid #E1E5EA',
        borderRadius: 12,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A2E' }}>
            Sjokoloko
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B7280', marginTop: 2 }}>
            Admin
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>E-post</label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              defaultValue="dev@pixlmedia.no"
              onFocus={() => setError('')}
              className="login-input"
              style={{
                height: 38, padding: '0 12px', border: '1px solid #E1E5EA',
                borderRadius: 6, fontSize: 13.5, outline: 'none', width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>Passord</label>
            <input
              name="password"
              type="password"
              required
              onFocus={() => setError('')}
              className="login-input"
              style={{
                height: 38, padding: '0 12px', border: '1px solid #E1E5EA',
                borderRadius: 6, fontSize: 13.5, outline: 'none', width: '100%',
              }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="login-btn"
            style={{
              height: 38, background: '#C9A35B', color: '#1A1A1A', border: 'none',
              borderRadius: 6, fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
              marginTop: 4, opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Logger inn…' : 'Logg inn'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
