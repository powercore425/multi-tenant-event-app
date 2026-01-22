'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, getEffectiveTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    const effectiveTheme = getEffectiveTheme()
    root.classList.add(effectiveTheme)
  }, [theme, getEffectiveTheme])

  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(getEffectiveTheme())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted, theme, getEffectiveTheme])

  // Prevent hydration mismatch by not applying theme class during SSR
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
