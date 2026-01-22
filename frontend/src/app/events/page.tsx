'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  const fetchEvents = async () => {
    try {
      setError(null)
      // Use axios directly for public endpoint to avoid auth interceptor issues
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`)
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (err: any) {
      console.error('Failed to fetch events:', err)
      setError(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner fullScreen size="lg" />
      </div>
    )
  }

  // If user is authenticated, use Layout, otherwise use simple layout
  if (mounted && isAuthenticated()) {
    if (loading) {
      return (
        <Layout>
          <LoadingSpinner size="md" />
        </Layout>
      )
    }

    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Events</h1>
          
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {events.length === 0 && !error ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No events available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}?tenantSlug=${event.tenant?.slug || ''}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  {event.image && (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      <p>{format(new Date(event.startDate), 'MMM d, yyyy')}</p>
                      <p>{event.location || 'Online'}</p>
                    </div>
                    {event.tickets && event.tickets.length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          From ${parseFloat(event.tickets[0].price.toString()).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Layout>
    )
  }

  // Public layout for unauthenticated users
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Event SaaS
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                href="/login"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Events</h1>
          
              {loading ? (
                <LoadingSpinner size="md" />
              ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {events.length === 0 && !error ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No events available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}?tenantSlug=${event.tenant?.slug || ''}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                    >
                      {event.image && (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          <p>{format(new Date(event.startDate), 'MMM d, yyyy')}</p>
                          <p>{event.location || 'Online'}</p>
                        </div>
                        {event.tickets && event.tickets.length > 0 && (
                          <div className="mt-4">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              From ${parseFloat(event.tickets[0].price.toString()).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
