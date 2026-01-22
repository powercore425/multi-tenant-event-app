'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function RegistrationsPage() {
  const { isTenantUser, user } = useAuthStore()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const isAdmin = user?.role === 'TENANT_ADMIN'

  useEffect(() => {
    if (!isTenantUser()) {
      router.push('/login')
      return
    }
    fetchEvents()
  }, [isTenantUser, router])

  useEffect(() => {
    if (selectedEvent) {
      fetchRegistrations()
    } else {
      setRegistrations([])
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/events')
      setEvents(response.data.events || [])
      if (response.data.events?.length > 0) {
        setSelectedEvent(response.data.events[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    if (!selectedEvent) return
    try {
      const response = await api.get(`/api/registrations/event/${selectedEvent}`)
      setRegistrations(response.data.registrations || [])
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    }
  }

  const handleCheckIn = async (registrationId: string) => {
    try {
      await api.post(`/api/registrations/${registrationId}/check-in`)
      fetchRegistrations()
    } catch (error) {
      console.error('Failed to check in:', error)
      alert('Failed to check in attendee')
    }
  }

  const handleStatusChange = async (registrationId: string, status: string) => {
    try {
      await api.put(`/api/registrations/${registrationId}/status`, { status })
      fetchRegistrations()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update registration status')
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Registrations</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {registration.firstName} {registration.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{registration.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {registration.ticket?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isAdmin ? (
                            <select
                              value={registration.status}
                              onChange={(e) => handleStatusChange(registration.id, e.target.value)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                                registration.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : registration.status === 'CHECKED_IN'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : registration.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="CHECKED_IN">Checked In</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                              registration.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : registration.status === 'CHECKED_IN'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : registration.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {registration.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {isAdmin && registration.status === 'CONFIRMED' && !registration.checkIns?.length && (
                                <button
                                  onClick={() => handleCheckIn(registration.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Check In</span>
                                </button>
                              )}
                            </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {registration.firstName} {registration.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{registration.email}</p>
                    </div>
                    {isAdmin ? (
                      <select
                        value={registration.status}
                        onChange={(e) => handleStatusChange(registration.id, e.target.value)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                          registration.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : registration.status === 'CHECKED_IN'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : registration.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CHECKED_IN">Checked In</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                        registration.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : registration.status === 'CHECKED_IN'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : registration.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {registration.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Ticket:</span> {registration.ticket?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Registered:</span> {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      {registration.status === 'CONFIRMED' && !registration.checkIns?.length && (
                        <button
                          onClick={() => handleCheckIn(registration.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Check In</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {selectedEvent && registrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No registrations for this event</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
