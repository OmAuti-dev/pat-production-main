import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/providers/providers'
import { Metadata } from 'next'
import { AuthSync } from '@/components/auth/auth-sync'
import { Toaster } from '@/components/ui/sonner'

const font = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: '🤖 PAT',
  description: 'Project Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta charSet="utf-8" />
        </head>
        <body className={`${font.className} antialiased`}>
          <Providers>
            <AuthSync />
            {children}
          </Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
