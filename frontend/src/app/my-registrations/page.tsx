'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function MyRegistrationsPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchRegistrations()
  }, [isAuthenticated, router])

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/api/registrations/my-registrations')
      setRegistrations(response.data.registrations || [])
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Registrations</h1>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't registered for any events yet</p>
            <Link
              href="/events"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {registration.event?.image && (
                  <img
                    src={registration.event.image}
                    alt={registration.event.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {registration.event?.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <p>
                      <span className="font-medium">Ticket:</span> {registration.ticket?.name}
                    </p>
                    <p>
                      <span className="font-medium">Registered:</span>{' '}
                      {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
                    </p>
                    {registration.amountPaid && (
                      <p>
                        <span className="font-medium">Amount Paid:</span> $
                        {parseFloat(registration.amountPaid.toString()).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        registration.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : registration.status === 'CHECKED_IN'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : registration.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {registration.status}
                    </span>
                    {registration.checkIns && registration.checkIns.length > 0 && (
                      <span className="text-sm text-green-600 dark:text-green-400">✓ Checked In</span>
                    )}
                  </div>
                  {registration.event && (
                    <Link
                      href={`/events/${registration.event.slug}?tenantSlug=${registration.event.tenant?.slug}`}
                      className="mt-4 block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Event
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
