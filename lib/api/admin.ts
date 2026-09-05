import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function adminFetch(path: string, init?: RequestInit) {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  // The access token lives 8 hours and the session carries no refresh token,
  // so it simply expires while someone has the admin open. Send them to the
  // login page instead of crashing every page with a 500.
  if (res.status === 401 || res.status === 403) {
    redirect('/login?expired=1')
  }
  if (!res.ok) throw new Error(`Admin API ${path} → ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

export async function adminGetStats() {
  return adminFetch('/api/admin/stats/')
}

export async function adminGetOrders(params?: { status?: string; search?: string }) {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.search) q.set('search', params.search)
  const qs = q.toString() ? `?${q}` : ''
  return adminFetch(`/api/admin/orders/${qs}`)
}

export async function adminGetOrder(orderNumber: string) {
  return adminFetch(`/api/admin/orders/${orderNumber}/`)
}

export async function adminUpdateOrderStatus(orderNumber: string, status: string) {
  return adminFetch(`/api/admin/orders/${orderNumber}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function adminGetProducts(params?: { category?: string; in_stock?: string }) {
  const q = new URLSearchParams()
  if (params?.category) q.set('category', params.category)
  if (params?.in_stock) q.set('in_stock', params.in_stock)
  const qs = q.toString() ? `?${q}` : ''
  return adminFetch(`/api/admin/products/${qs}`)
}

export async function adminGetProduct(id: number) {
  return adminFetch(`/api/admin/products/${id}/`)
}

export async function adminCreateProduct(data: FormData) {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/products/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: data,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Create product → ${res.status}`)
  return res.json()
}

export async function adminUpdateProduct(id: number, data: FormData) {
  const session = await auth()
  const token = (session as any)?.accessToken as string | undefined
  const res = await fetch(`${API}/api/admin/products/${id}/`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: data,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Update product → ${res.status}`)
  return res.json()
}

export async function adminDeleteProduct(id: number) {
  return adminFetch(`/api/admin/products/${id}/`, { method: 'DELETE' })
}

export async function adminGetUsers(params?: { search?: string }) {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  const qs = q.toString() ? `?${q}` : ''
  return adminFetch(`/api/admin/users/${qs}`)
}

export async function adminGetUser(id: string) {
  return adminFetch(`/api/admin/users/${id}/`)
}

export async function adminGetWaitlist(params?: { batch?: string }) {
  const q = new URLSearchParams()
  if (params?.batch) q.set('batch', params.batch)
  const qs = q.toString() ? `?${q}` : ''
  return adminFetch(`/api/admin/waitlist/${qs}`)
}

export async function adminGetLoyalty(params?: { search?: string }) {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  const qs = q.toString() ? `?${q}` : ''
  return adminFetch(`/api/admin/loyalty/${qs}`)
}

export async function adminGetContact(params?: { is_read?: string }) {
  const q = new URLSearchParams()
  if (params?.is_read !== undefined) q.set('is_read', params.is_read)
  const qs = q.toString() ? `?${q}` : ''
  return adminFetch(`/api/admin/contact/${qs}`)
}

export async function adminMarkContactRead(id: number) {
  return adminFetch(`/api/admin/contact/${id}/`, { method: 'PATCH' })
}

export async function adminDeleteOrder(orderNumber: string) {
  return adminFetch(`/api/admin/orders/${orderNumber}/`, { method: 'DELETE' })
}

export async function adminUpdateUser(id: string, data: { name?: string; email?: string; is_admin?: boolean }) {
  return adminFetch(`/api/admin/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function adminDeleteUser(id: string) {
  return adminFetch(`/api/admin/users/${id}/`, { method: 'DELETE' })
}

export async function adminDeleteContact(id: number) {
  return adminFetch(`/api/admin/contact/${id}/`, { method: 'DELETE' })
}

export async function adminDeleteWaitlist(id: number) {
  return adminFetch(`/api/admin/waitlist/${id}/`, { method: 'DELETE' })
}
