'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeToggle() {
  const { setTheme, getEffectiveTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const currentEffectiveTheme = getEffectiveTheme()
    // Toggle between light and dark only
    if (currentEffectiveTheme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    // During SSR, show a consistent icon to prevent hydration mismatch
    if (!mounted) {
      return <Sun className="h-5 w-5" />
    }
    const effectiveTheme = getEffectiveTheme()
    if (effectiveTheme === 'light') {
      return <Sun className="h-5 w-5" />
    }
    return <Moon className="h-5 w-5" />
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-200
      hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200`}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {getIcon()}
    </button>
  )
}
