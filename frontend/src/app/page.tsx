'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Wait a bit for auth state to hydrate
    const timer = setTimeout(() => {
      if (!isAuthenticated()) {
        router.push('/login')
        return
      }

      // Redirect based on role
      if (user?.role === 'SUPER_ADMIN') {
        router.push('/super-admin')
      } else if (user?.role === 'TENANT_ADMIN' || user?.role === 'TENANT_USER') {
        router.push('/tenant')
      } else {
        router.push('/events')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [user, isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner size="lg" />
    </div>
  )
}
