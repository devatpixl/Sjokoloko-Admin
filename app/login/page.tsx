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
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          Sjokoloko
          <span>Admin</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="admin-label" htmlFor="login-email">E-post</label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoFocus
              defaultValue="dev@pixlmedia.no"
              onFocus={() => setError('')}
              className="login-input admin-form-input"
            />
          </div>

          <div className="login-field">
            <label className="admin-label" htmlFor="login-password">Passord</label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              onFocus={() => setError('')}
              className="login-input admin-form-input"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            disabled={isPending}
            className="login-btn admin-btn admin-btn-primary admin-btn-lg"
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
