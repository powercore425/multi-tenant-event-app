'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { useTenantColors } from '@/hooks/useTenantColors'
import { Grid, List, Eye, Edit, Trash2, Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ImageWithLoading } from '@/components/ImageWithLoading'

export default function TenantEventsPage() {
  const { isTenantUser, user } = useAuthStore()
  const router = useRouter()
  const colors = useTenantColors()
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const isAdmin = user?.role === 'TENANT_ADMIN'

  useEffect(() => {
    if (!isTenantUser()) {
      router.push('/login')
      return
    }
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTenantUser, router])

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      const response = await api.get(`/api/events?${params.toString()}`)
      setEvents(response.data.events || [])
      setFilteredEvents(response.data.events || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await api.delete(`/api/events/${id}`)
      fetchEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event')
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
      <div>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
            {isAdmin && (
              <Link
                href="/tenant/events/new"
                className="w-full sm:w-auto px-4 py-2 text-white rounded text-center transition-colors"
                style={{
                  backgroundColor: colors.primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.getHoverColor(colors.primaryColor)
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryColor
                }}
              >
                Create Event
              </Link>
            )}
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col gap-4">
            {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              {/* Status Filter */}
              <div className="flex-1 w-full sm:w-auto min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  View:
                </label>
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 sm:px-4 py-2 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    style={viewMode === 'grid' ? {
                      backgroundColor: colors.primaryColor,
                    } : {}}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 sm:px-4 py-2 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    style={viewMode === 'list' ? {
                      backgroundColor: colors.primaryColor,
                    } : {}}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {statusFilter ? `No events with status "${statusFilter}"` : 'No events yet'}
            </p>
            {isAdmin && !statusFilter && (
              <Link
                href="/tenant/events/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: colors.primaryColor,
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Event</span>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] group overflow-hidden">
                {event.image && (
                  <div className="overflow-hidden">
                    <ImageWithLoading
                      src={event.image}
                      alt={event.title}
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {event.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                        event.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : event.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : event.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <p>{format(new Date(event.startDate), 'MMM d, yyyy h:mm a')}</p>
                    <p>{event.location || 'Online'}</p>
                    <p className="mt-2">Registrations: {event._count?.registrations || 0}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/tenant/events/${event.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded transition-all shadow-sm hover:shadow-md"
                      style={{
                        backgroundColor: colors.primaryColor,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.getHoverColor(colors.primaryColor)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primaryColor
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href={`/tenant/events/${event.id}/edit`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-[1.01] border-l-4 border-transparent hover:border-blue-500">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {event.image && (
                      <div className="flex-shrink-0 overflow-hidden rounded-lg">
                        <ImageWithLoading
                          src={event.image}
                          alt={event.title}
                          width={192}
                          height={128}
                          className="w-full lg:w-48 h-32 lg:h-24 object-cover rounded-lg transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded whitespace-nowrap self-start ${
                            event.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : event.status === 'DRAFT'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              : event.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div>
                          <span className="font-medium">Date:</span> {format(new Date(event.startDate), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {event.location || 'Online'}
                        </div>
                        <div>
                          <span className="font-medium">Registrations:</span> {event._count?.registrations || 0}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/tenant/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded transition-all shadow-sm hover:shadow-md text-sm"
                          style={{
                            backgroundColor: colors.primaryColor,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.getHoverColor(colors.primaryColor)
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.primaryColor
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Link>
                        {isAdmin && (
                          <>
                            <Link
                              href={`/tenant/events/${event.id}/edit`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all shadow-sm hover:shadow-md text-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
