'use client'

import * as React from 'react'
import NoSSR from './NoSSR'

function ThemeProviderInner({ 
  children, 
  ...props 
}: {
  children: React.ReactNode
  [key: string]: any
}) {
  const [ThemeProvider, setThemeProvider] = React.useState<React.ComponentType<any> | null>(null)

  React.useEffect(() => {
    // Only import next-themes after component mounts (client-side only)
    import('next-themes').then((nextThemes) => {
      const NextThemesProvider = nextThemes.ThemeProvider
      const ThemeProviderComponent = ({ children: themeChildren, ...themeProps }: any) => (
        <NextThemesProvider
          {...themeProps}
          storageKey="bytedialogue-theme"
          enableSystem
          disableTransitionOnChange
        >
          {themeChildren}
        </NextThemesProvider>
      )
      setThemeProvider(() => ThemeProviderComponent)
    })
  }, [])

  if (!ThemeProvider) {
    return <>{children}</>
  }

  return <ThemeProvider {...props}>{children}</ThemeProvider>
}

export function ThemeProviderWrapper({ 
  children, 
  ...props 
}: {
  children: React.ReactNode
  [key: string]: any
}) {
  return (
    <NoSSR>
      <ThemeProviderInner {...props}>{children}</ThemeProviderInner>
    </NoSSR>
  )
}

