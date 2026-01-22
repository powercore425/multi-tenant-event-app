'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  Calendar,
  MapPin,
  Ticket,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Building2,
  User,
  Mail,
  Phone,
  Grid,
  List,
  ArrowUpDown,
  Filter,
} from 'lucide-react'

type ViewMode = 'grid' | 'list'
type SortOption = 'date-asc' | 'date-desc' | 'event-asc' | 'event-desc' | 'status-asc' | 'status-desc'
type StatusFilter = 'all' | 'CONFIRMED' | 'PENDING' | 'CHECKED_IN' | 'CANCELLED'

export default function MyRegistrationsPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchRegistrations()
  }, [isAuthenticated, router])

  useEffect(() => {
    sortAndFilterRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, statusFilter, registrations])

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

  const sortAndFilterRegistrations = () => {
    let filtered = [...registrations]

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((reg) => reg.status === statusFilter)
    }

    // Apply sorting
    switch (sortOption) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime())
        break
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
        break
      case 'event-asc':
        filtered.sort((a, b) => (a.event?.title || '').localeCompare(b.event?.title || ''))
        break
      case 'event-desc':
        filtered.sort((a, b) => (b.event?.title || '').localeCompare(a.event?.title || ''))
        break
      case 'status-asc':
        filtered.sort((a, b) => a.status.localeCompare(b.status))
        break
      case 'status-desc':
        filtered.sort((a, b) => b.status.localeCompare(a.status))
        break
    }

    setFilteredRegistrations(filtered)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold'
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </span>
        )
      case 'CHECKED_IN':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
            <CheckCircle2 className="h-3 w-3" />
            Checked In
          </span>
        )
      case 'PENDING':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
      case 'CANCELLED':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
            {status}
          </span>
        )
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium'
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300`}>
            <CreditCard className="h-3 w-3" />
            Paid
          </span>
        )
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300`}>
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`}>
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        )
      default:
        return null
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
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-2">
                My Registrations
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view all your event registrations
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-3 flex-1">
                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

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
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="event-asc">Event (A-Z)</option>
                  <option value="event-desc">Event (Z-A)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
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

        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Ticket className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} registrations` : 'No registrations yet'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              {statusFilter !== 'all' 
                ? 'Try selecting a different status filter'
                : 'Start exploring events and register to see them here'}
            </p>
            {statusFilter === 'all' && (
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ExternalLink className="h-5 w-5" />
                Browse Events
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group"
              >
                {/* Event Image */}
                {registration.event?.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={registration.event.image}
                      alt={registration.event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold text-white mb-1 line-clamp-2">
                        {registration.event.title}
                      </h2>
                      {registration.event.tenant && (
                        <div className="flex items-center gap-2">
                          {registration.event.tenant.logo ? (
                            <img
                              src={registration.event.tenant.logo}
                              alt={registration.event.tenant.name}
                              className="h-4 w-4 rounded object-cover ring-1 ring-white/50"
                            />
                          ) : (
                            <div
                              className="h-4 w-4 rounded flex items-center justify-center"
                              style={{
                                backgroundColor: registration.event.tenant.primaryColor || '#3b82f6',
                              }}
                            >
                              <Building2 className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-white/90">
                            {registration.event.tenant.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-5">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {getStatusBadge(registration.status)}
                    {registration.amountPaid !== null && registration.amountPaid > 0 && (
                      getPaymentStatusBadge(registration.paymentStatus || 'pending')
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {registration.ticket?.name || 'Standard Ticket'}
                    </p>
                  </div>

                  {/* Registration Date */}
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registered</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Payment Info */}
                  {registration.amountPaid !== null && registration.amountPaid > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                      </div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${parseFloat(registration.amountPaid.toString()).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Event Date */}
                  {registration.event?.startDate && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Event Date</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(new Date(registration.event.startDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  {registration.event && (
                    <Link
                      href={`/events/${registration.event.slug}?tenantSlug=${registration.event.tenant?.slug}`}
                      className="mt-4 block w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Event
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Event Image */}
                  {registration.event?.image && (
                    <div className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden">
                      <img
                        src={registration.event.image}
                        alt={registration.event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-6">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {registration.event?.title || 'Event'}
                        </h2>
                        {registration.event?.tenant && (
                          <div className="flex items-center gap-2 mb-3">
                            {registration.event.tenant.logo ? (
                              <img
                                src={registration.event.tenant.logo}
                                alt={registration.event.tenant.name}
                                className="h-5 w-5 rounded object-cover"
                              />
                            ) : (
                              <div
                                className="h-5 w-5 rounded flex items-center justify-center"
                                style={{
                                  backgroundColor: registration.event.tenant.primaryColor || '#3b82f6',
                                }}
                              >
                                <Building2 className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {registration.event.tenant.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(registration.status)}
                        {registration.amountPaid !== null && registration.amountPaid > 0 && (
                          getPaymentStatusBadge(registration.paymentStatus || 'pending')
                        )}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ticket</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {registration.ticket?.name || 'Standard'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Registered</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
                        </p>
                      </div>

                      {registration.event?.startDate && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Event Date</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {format(new Date(registration.event.startDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}

                      {registration.amountPaid !== null && registration.amountPaid > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount</p>
                          </div>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            ${parseFloat(registration.amountPaid.toString()).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Registered As</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {registration.firstName} {registration.lastName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{registration.email}</span>
                        </div>
                        {registration.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{registration.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {registration.event && (
                      <Link
                        href={`/events/${registration.event.slug}?tenantSlug=${registration.event.tenant?.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Event Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
