import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@patternfly/react-core/dist/styles/base.css'
import './globals.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { QueryProvider } from './contexts/QueryProvider'
import { SessionErrorBoundary } from './components/SessionErrorBoundary'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Project Genie',
  description: 'AI-powered chat application with PatternFly design system',
  keywords: ['chat', 'AI', 'PatternFly', 'accessible'],
  authors: [{ name: 'Project Genie Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SessionErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <ChatProvider>{children}</ChatProvider>
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </SessionErrorBoundary>
      </body>
    </html>
  )
}
