import type { Metadata } from 'next'
import { Fraunces, Manrope, Geist_Mono } from 'next/font/google'
import './admin.css'

// The same three faces the storefront loads. The admin used to wear Inter,
// which is why it read like a generic dashboard rather than part of this
// brand — Fraunces at 300 with these axes is the voice customers already see.
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
  weight: 'variable',
  style: ['normal', 'italic'],
  variable: '--font-admin-display',
  display: 'swap',
})

// Manrope carries everything that has to stay legible at 13px: table data,
// labels, buttons. Fraunces is for display only — a light serif at data sizes
// is a readability problem, not a flourish.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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

// Dark is the default, so the server renders data-theme="dark" on <html> and
// this only flips it to light for someone who has explicitly chosen light.
// Rendering the attribute server-side rather than letting a script add it
// means there is no flash on a cold load, and the panel still comes up dark
// with JavaScript disabled. suppressHydrationWarning on <html> is what lets
// the value differ between server and client without a warning.
const THEME_BOOTSTRAP = `(function(){try{if(localStorage.getItem('sl-admin-theme')==='light'){document.documentElement.dataset.theme='light'}}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="no"
      data-theme="dark"
      className={`${manrope.variable} ${fraunces.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Tells the browser to render native controls — checkboxes, date
            pickers, select popups, scrollbars — in the matching scheme. CSS
            cannot reach inside those, so without this they stay light. */}
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
