import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './admin.css'

// 700 is loaded because the design system uses it for page titles, stat values,
// table headers and badges. Without it the browser synthesises a faux bold,
// which is a large part of why the panel used to read hand-made.
const inter = Inter({
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

// Runs before first paint, so a dark-mode user never sees a white flash.
// It only mirrors localStorage onto the element; with nothing stored the
// attribute stays absent and the stylesheet falls back to prefers-color-scheme.
// The <html> tag already carries suppressHydrationWarning, which is exactly
// what lets this attribute differ between server and client without a warning.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('sl-admin-theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Tells the browser to render native controls — checkboxes, date
            pickers, select popups, scrollbars — in the matching scheme. CSS
            cannot reach inside those, so without this they stay light. */}
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
