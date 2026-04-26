import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './admin.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-admin',
  display: 'swap',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-admin-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sjokoloko Admin',
  robots: 'noindex',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
