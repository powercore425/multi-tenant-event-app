'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'

export function ThemeToggle() {
  const { theme, setTheme, getEffectiveTheme } = useThemeStore()
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

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
        ${isSuperAdmin
          ? 'bg-white/10 hover:bg-white/20 text-purple-100 hover:text-white border border-white/20 hover:border-white/30 shadow-sm hover:shadow-md'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `}
      aria-label="Toggle theme"
    >
      {getIcon()}
    </button>
  )
}
