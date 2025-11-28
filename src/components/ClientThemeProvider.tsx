'use client'

import { useEffect, useState } from 'react'

export default function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [ThemeProvider, setThemeProvider] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    setMounted(true)
    // Dynamically import next-themes only after component mounts (client-side only)
    import('next-themes').then((mod) => {
      const Provider = mod.ThemeProvider
      setThemeProvider(() => Provider)
    })
  }, [])

  // Render children without theme provider during SSR and initial client render
  if (!mounted || !ThemeProvider) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="bytedialogue-theme"
    >
      {children}
    </ThemeProvider>
  )
}

