'use client'

import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeProvider } from '@/components/theme-provider'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { CreditsProvider } from '@/contexts/CreditsContext'
import CreditBalance from '@/components/CreditBalance'
import './globals.css'
import { Toaster } from 'sonner'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>ShapeShift.AI - Transform Ideas into 3D Reality</title>
          <link rel="icon" href="/ShapeShiftLogo.png" type="image/png" />
          <meta name="description" content="Transform your ideas into stunning 3D models using AI technology. Perfect for designers, developers, and creators." />
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="beforeInteractive"
          />
        </head>
        <body className={`${inter.className} min-h-screen`}>
          <ThemeProvider>
            <NotificationProvider>
              <CreditsProvider>
                <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                  {children}
                  <CreditBalance />
                </div>
              </CreditsProvider>
            </NotificationProvider>
          </ThemeProvider>
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
} 