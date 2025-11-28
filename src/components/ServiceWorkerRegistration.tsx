'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/serviceWorker'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }
  }, [])

  return null
}

