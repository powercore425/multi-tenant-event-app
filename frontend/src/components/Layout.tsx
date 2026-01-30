'use client'

import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from './ThemeToggle'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

interface LayoutProps {
  children: React.ReactNode
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function Layout({ children }: LayoutProps) {
  const { user, token, clearAuth } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check authentication by directly checking user and token
  const isAuthenticated = !!(user && token)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      // Use replace to avoid adding to history
      router.replace('/login')
    }
  }, [mounted, isAuthenticated, router])

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner fullScreen size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner fullScreen size="lg" text="Redirecting..." />
      </div>
    )
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const getNavLinks = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { href: '/super-admin', label: 'Dashboard' },
        { href: '/super-admin/tenants', label: 'Tenants' },
        { href: '/super-admin/analytics', label: 'Analytics' },
        { href: '/super-admin/settings', label: 'Settings' },
      ]
    } else if (user?.role === 'TENANT_ADMIN') {
      return [
        { href: '/tenant', label: 'Dashboard' },
        { href: '/tenant/events', label: 'Events' },
        { href: '/tenant/registrations', label: 'Registrations' },
        { href: '/tenant/users', label: 'Users' },
        { href: '/tenant/settings', label: 'Settings' },
      ]
    } else if (user?.role === 'TENANT_USER') {
      return [
        { href: '/tenant', label: 'Dashboard' },
        { href: '/tenant/events', label: 'Events' },
        { href: '/tenant/registrations', label: 'Registrations' },
      ]
    } else {
      return [
        { href: '/events', label: 'Events' },
        { href: '/my-registrations', label: 'My Registrations' },
        { href: '/settings', label: 'Settings' },
      ]
    }
  }

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'TENANT_ADMIN':
        return 'Tenant Admin'
      case 'TENANT_USER':
        return 'Tenant User'
      case 'ATTENDEE':
        return 'Attendee'
      default:
        return 'User'
    }
  }

  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      case 'TENANT_ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'TENANT_USER':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
      case 'ATTENDEE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  const isActiveLink = (href: string) => {
    if (!pathname) return false
    
    // Exact match for root
    if (href === '/') {
      return pathname === '/' || pathname === '/super-admin' || pathname === '/tenant'
    }
    
    // For dashboard links, check exact match or if it's the base path
    if (href === '/super-admin') {
      return pathname === '/super-admin'
    }
    
    if (href === '/tenant') {
      return pathname === '/tenant'
    }
    
    // For other links, check if pathname starts with href and handle edge cases
    // This ensures /super-admin/tenants matches /super-admin/tenants but not /super-admin
    if (pathname === href) {
      return true
    }
    
    // For nested routes, ensure we match the full path segment
    // e.g., /super-admin/tenants should match /super-admin/tenants but not /super-admin/tenants/new
    if (pathname.startsWith(href + '/')) {
      return true
    }
    
    return false
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className={`${
        isSuperAdmin 
          ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 dark:from-purple-950 dark:via-indigo-950 dark:to-purple-950 border-b border-purple-700/50 dark:border-purple-800/50 shadow-lg' 
          : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 group"
                >
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-lg group-hover:shadow-xl transition-all ${
                      isSuperAdmin ? 'ring-2 ring-purple-400/50' : ''
                    }`}
                    style={{
                      background: isSuperAdmin
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #a855f7 100%)'
                        : user?.tenant?.primaryColor && user?.tenant?.secondaryColor
                        ? `linear-gradient(to bottom right, ${user.tenant.primaryColor}, ${user.tenant.secondaryColor})`
                        : 'linear-gradient(to bottom right, #3b82f6, #6366f1)'
                    }}
                  >
                    {isSuperAdmin ? (
                      <Shield className="h-6 w-6 text-white" fill="currentColor" />
                    ) : (
                      <span className="text-white font-bold text-lg">E</span>
                    )}
                  </div>
                  <span className={`text-xl font-bold ${
                    isSuperAdmin
                      ? 'text-white'
                      : 'bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent'
                  }`}>
                    {isSuperAdmin ? 'Platform Admin' : 'Event SaaS'}
                  </span>
                </Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {getNavLinks().map((link) => {
                  const isActive = isActiveLink(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        relative inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
                        ${isActive
                          ? isSuperAdmin
                            ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                            : 'shadow-sm border'
                          : isSuperAdmin
                          ? 'text-purple-200 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }
                      `}
                      style={!isSuperAdmin && isActive ? {
                        color: user?.tenant?.primaryColor ? `${user.tenant.primaryColor}` : '#1d4ed8',
                        backgroundColor: user?.tenant?.primaryColor ? `${user.tenant.primaryColor}15` : 'rgba(59, 130, 246, 0.1)',
                        borderColor: user?.tenant?.primaryColor ? `${user.tenant.primaryColor}40` : 'rgba(59, 130, 246, 0.2)',
                      } : {}}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {isActive && !isSuperAdmin && (
                        <>
                          <span 
                            className="absolute inset-0 rounded-lg"
                            style={{
                              backgroundColor: user?.tenant?.primaryColor ? `${user.tenant.primaryColor}15` : 'rgba(59, 130, 246, 0.1)',
                            }}
                          />
                          <span 
                            className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
                            style={{
                              backgroundColor: user?.tenant?.primaryColor || '#3b82f6',
                            }}
                          />
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <ThemeToggle />
              {user && (
                <>
                  {/* Desktop User Info */}
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                      isSuperAdmin
                        ? 'bg-white/10 backdrop-blur-sm border border-white/20'
                        : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex-shrink-0">
                        <div 
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ${
                            isSuperAdmin ? 'ring-2 ring-purple-300/50' : 'ring-2 ring-white dark:ring-gray-800'
                          }`}
                          style={{
                            background: isSuperAdmin
                              ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #a855f7 100%)'
                              : user?.tenant?.primaryColor && user?.tenant?.secondaryColor
                              ? `linear-gradient(to bottom right, ${user.tenant.primaryColor}, ${user.tenant.secondaryColor})`
                              : 'linear-gradient(to bottom right, #3b82f6, #6366f1)'
                          }}
                        >
                          {isSuperAdmin ? (
                            <Shield className="h-5 w-5" fill="currentColor" />
                          ) : (
                            getUserInitials()
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-semibold truncate ${
                          isSuperAdmin ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {user.firstName} {user.lastName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)} font-medium`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                        isSuperAdmin 
                          ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl' 
                          : 'shadow-sm hover:shadow'
                      }`}
                      style={!isSuperAdmin ? {
                        backgroundColor: user?.tenant?.primaryColor || '#3b82f6',
                      } : {}}
                      onMouseEnter={(e) => {
                        if (!isSuperAdmin && user?.tenant?.primaryColor) {
                          const rgb = hexToRgb(user.tenant.primaryColor)
                          if (rgb) {
                            e.currentTarget.style.backgroundColor = rgbToHex(
                              Math.max(0, rgb.r - 20),
                              Math.max(0, rgb.g - 20),
                              Math.max(0, rgb.b - 20)
                            )
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSuperAdmin) {
                          e.currentTarget.style.backgroundColor = user?.tenant?.primaryColor || '#3b82f6'
                        }
                      }}
                    >
                      Logout
                    </button>
                  </div>
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className={`md:hidden inline-flex items-center justify-center p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-inset ${
                      isSuperAdmin
                        ? 'text-purple-200 hover:text-white hover:bg-white/10 focus:ring-purple-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-500'
                    }`}
                    aria-expanded="false"
                  >
                    <span className="sr-only">Open main menu</span>
                    {!mobileMenuOpen ? (
                      <svg
                        className="block h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    ) : (
                      <svg
                        className="block h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${
            isSuperAdmin
              ? 'border-purple-700/50 bg-purple-950/50 backdrop-blur-sm'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm'
          }`}>
            <div className="pt-2 pb-3 space-y-1 px-4">
              {getNavLinks().map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        relative block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200
                        ${isActive
                          ? isSuperAdmin
                            ? 'bg-white/20 text-white border-l-4 border-purple-300 shadow-lg'
                            : 'border-l-4 shadow-sm'
                          : isSuperAdmin
                          ? 'text-purple-200 hover:text-white hover:bg-white/10'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      style={!isSuperAdmin && isActive ? {
                        color: user?.tenant?.primaryColor || '#1d4ed8',
                        backgroundColor: user?.tenant?.primaryColor ? `${user.tenant.primaryColor}15` : 'rgba(59, 130, 246, 0.1)',
                        borderLeftColor: user?.tenant?.primaryColor || '#3b82f6',
                      } : {}}
                    >
                      {link.label}
                      {isActive && !isSuperAdmin && (
                        <span 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: user?.tenant?.primaryColor || '#3b82f6',
                          }}
                        />
                      )}
                    </Link>
                )
              })}
            </div>
            {user && (
              <div className={`pt-4 pb-3 border-t px-4 ${
                isSuperAdmin
                  ? 'border-purple-700/50 bg-purple-950/80'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}>
                <div className="flex items-center px-3 mb-4">
                  <div className="flex-shrink-0">
                    <div 
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${
                        isSuperAdmin 
                          ? 'ring-2 ring-purple-300/50 bg-gradient-to-br from-purple-600 to-indigo-600' 
                          : 'ring-2 ring-white dark:ring-gray-700 bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}
                    >
                      {isSuperAdmin ? (
                        <Shield className="h-6 w-6" fill="currentColor" />
                      ) : (
                        getUserInitials()
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className={`text-base font-semibold truncate ${
                      isSuperAdmin ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className={`w-full px-4 py-2.5 text-base font-medium text-white rounded-lg transition-all ${
                    isSuperAdmin
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                  style={!isSuperAdmin && user?.tenant?.primaryColor && user?.tenant?.secondaryColor ? {
                    background: `linear-gradient(to right, ${user.tenant.primaryColor}, ${user.tenant.secondaryColor})`
                  } : !isSuperAdmin ? {
                    background: 'linear-gradient(to right, #dc2626, #b91c1c)'
                  } : {}}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
