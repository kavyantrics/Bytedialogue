import '@/lib/polyfills'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'
import 'react-loading-skeleton/dist/skeleton.css'
import 'simplebar-react/dist/simplebar.min.css'
import { Toaster } from '@/components/ui/toaster'
import TRPCProvider from './_trpc/Provider'
import ClientThemeProvider from '@/components/ClientThemeProvider'
import Navbar from '@/components/Navbar'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ByteDialogue - AI-Powered PDF Intelligence Platform',
  description: 'Chat with your PDF documents using AI. Upload PDFs and get instant answers to your questions. Transform static files into interactive knowledge.',
  keywords: ['PDF chat', 'AI documents', 'PDF intelligence', 'document Q&A', 'AI assistant', 'PDF analysis'],
  authors: [{ name: 'ByteDialogue' }],
  creator: 'ByteDialogue',
  publisher: 'ByteDialogue',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'ByteDialogue - AI-Powered PDF Intelligence Platform',
    description: 'Chat with your PDF documents using AI. Upload PDFs and get instant answers to your questions.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'ByteDialogue',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ByteDialogue - AI-Powered PDF Intelligence Platform',
    description: 'Chat with your PDF documents using AI. Upload PDFs and get instant answers to your questions.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport = {
  themeColor: '#FFF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            'min-h-screen font-sans antialiased grainy',
            inter.className
        )}
        suppressHydrationWarning
      >
        <Suspense fallback={<div suppressHydrationWarning>{children}</div>}>
          <ClientThemeProvider>
            <TRPCProvider>
              <Suspense fallback={null}>
                <Toaster />
              </Suspense>
              <ServiceWorkerRegistration />
              <Navbar />
              {children}
            </TRPCProvider>
          </ClientThemeProvider>
        </Suspense>
        </body>
    </html>
  )
}
