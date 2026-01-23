'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Building2, Grid, List, ArrowUpDown, Calendar, MapPin, DollarSign } from 'lucide-react'
import { ImageWithLoading } from '@/components/ImageWithLoading'

type ViewMode = 'grid' | 'list'
type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortOption, setSortOption] = useState<SortOption>('date-asc')
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

  useEffect(() => {
    sortAndFilterEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, events])

  const fetchEvents = async () => {
    try {
      setError(null)
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

  const sortAndFilterEvents = () => {
    let sorted = [...events]

    switch (sortOption) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        break
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        break
      case 'price-asc':
        sorted.sort((a, b) => {
          const priceA = a.tickets?.[0]?.price ? parseFloat(a.tickets[0].price.toString()) : 0
          const priceB = b.tickets?.[0]?.price ? parseFloat(b.tickets[0].price.toString()) : 0
          return priceA - priceB
        })
        break
      case 'price-desc':
        sorted.sort((a, b) => {
          const priceA = a.tickets?.[0]?.price ? parseFloat(a.tickets[0].price.toString()) : 0
          const priceB = b.tickets?.[0]?.price ? parseFloat(b.tickets[0].price.toString()) : 0
          return priceB - priceA
        })
        break
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    setFilteredEvents(sorted)
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
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Elite Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-2">
                  Discover Events
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore amazing events happening around you
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Sort Filter */}
                <div className="flex items-center gap-3 flex-1">
                  <ArrowUpDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                  >
                    <option value="date-asc">Date (Earliest First)</option>
                    <option value="date-desc">Date (Latest First)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    View:
                  </label>
                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                      aria-label="List view"
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {filteredEvents.length === 0 && !error ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">No events available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Check back later for new events</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}?tenantSlug=${event.tenant?.slug || ''}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {event.image && (
                    <div className="relative overflow-hidden h-56">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  <div className="p-6">
                    {/* Tenant Information */}
                    {event.tenant && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        {event.tenant.logo ? (
                          <ImageWithLoading
                            src={event.tenant.logo}
                            alt={event.tenant.name}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                            showBlur={false}
                            showSpinner={false}
                          />
                        ) : (
                          <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center shadow-md"
                            style={{
                              background: event.tenant.primaryColor && event.tenant.secondaryColor
                                ? `linear-gradient(135deg, ${event.tenant.primaryColor}, ${event.tenant.secondaryColor})`
                                : event.tenant.primaryColor || '#3b82f6',
                            }}
                          >
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {event.tenant.name}
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.tickets && event.tickets.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-base font-bold text-green-600 dark:text-green-400">
                            From ${parseFloat(event.tickets[0].price.toString()).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}?tenantSlug=${event.tenant?.slug || ''}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    {event.image && (
                      <div className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden">
                        <ImageWithLoading
                          src={event.image}
                          alt={event.title}
                          width={256}
                          height={192}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          {event.tenant && (
                            <div className="flex items-center gap-2 mb-2">
                              {event.tenant.logo ? (
                                <img
                                  src={event.tenant.logo}
                                  alt={event.tenant.name}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <div
                                  className="h-6 w-6 rounded flex items-center justify-center"
                                  style={{
                                    backgroundColor: event.tenant.primaryColor || '#3b82f6',
                                  }}
                                >
                                  <Building2 className="h-3 w-3 text-white" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {event.tenant.name}
                              </span>
                            </div>
                          )}
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {event.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.tickets && event.tickets.length > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="font-bold text-green-600 dark:text-green-400">
                              From ${parseFloat(event.tickets[0].price.toString()).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-2">
                  Discover Events
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore amazing events happening around you
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <ArrowUpDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                  >
                    <option value="date-asc">Date (Earliest First)</option>
                    <option value="date-desc">Date (Latest First)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    View:
                  </label>
                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="md" />
          ) : (
            <>
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {filteredEvents.length === 0 && !error ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">No events available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Check back later for new events</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}?tenantSlug=${event.tenant?.slug || ''}`}
                      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      {event.image && (
                        <div className="relative overflow-hidden h-56">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      )}
                      <div className="p-6">
                        {event.tenant && (
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                            {event.tenant.logo ? (
                              <img
                                src={event.tenant.logo}
                                alt={event.tenant.name}
                                className="h-7 w-7 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                              />
                            ) : (
                              <div
                                className="h-7 w-7 rounded-lg flex items-center justify-center shadow-md"
                                style={{
                                  background: event.tenant.primaryColor && event.tenant.secondaryColor
                                    ? `linear-gradient(135deg, ${event.tenant.primaryColor}, ${event.tenant.secondaryColor})`
                                    : event.tenant.primaryColor || '#3b82f6',
                                }}
                              >
                                <Building2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {event.tenant.name}
                            </span>
                          </div>
                        )}

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                        {event.tickets && event.tickets.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-base font-bold text-green-600 dark:text-green-400">
                                From ${parseFloat(event.tickets[0].price.toString()).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}?tenantSlug=${event.tenant?.slug || ''}`}
                      className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {event.image && (
                          <div className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              {event.tenant && (
                                <div className="flex items-center gap-2 mb-2">
                                  {event.tenant.logo ? (
                                    <img
                                      src={event.tenant.logo}
                                      alt={event.tenant.name}
                                      className="h-6 w-6 rounded object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="h-6 w-6 rounded flex items-center justify-center"
                                      style={{
                                        backgroundColor: event.tenant.primaryColor || '#3b82f6',
                                      }}
                                    >
                                      <Building2 className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {event.tenant.name}
                                  </span>
                                </div>
                              )}
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {event.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                {event.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.tickets && event.tickets.length > 0 && (
                              <div className="flex items-center gap-2 ml-auto">
                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  From ${parseFloat(event.tickets[0].price.toString()).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
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
