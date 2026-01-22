'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { CheckCircle2, Calendar, Ticket, User, Building2, Globe } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface RegistrationForm {
  ticketId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
}

export default function EventDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const tenantSlug = searchParams?.get('tenantSlug')
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [existingRegistration, setExistingRegistration] = useState<any>(null)
  const [checkingRegistration, setCheckingRegistration] = useState(false)
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RegistrationForm>({
    defaultValues: {
      ticketId: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  })

  useEffect(() => {
    fetchEvent()
  }, [slug, tenantSlug])

  // Check if user has already registered for this event
  useEffect(() => {
    if (isAuthenticated() && user && event?.id && !checkingRegistration) {
      checkRegistrationStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, event?.id])

  const checkRegistrationStatus = async () => {
    if (!isAuthenticated() || !user) return
    
    setCheckingRegistration(true)
    try {
      const response = await api.get('/api/registrations/my-registrations')
      const registrations = response.data.registrations || []
      const registration = registrations.find((reg: any) => reg.eventId === event?.id && reg.status !== 'CANCELLED')
      if (registration) {
        setExistingRegistration(registration)
        setSuccess(true) // Show success state
      }
    } catch (err) {
      console.error('Failed to check registration status:', err)
    } finally {
      setCheckingRegistration(false)
    }
  }

  // Pre-fill form with user info when authenticated
  useEffect(() => {
    if (isAuthenticated() && user && event) {
      if (event.tickets && event.tickets.length > 0) {
        const defaultTicketId = event.tickets[0].id
        reset({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          ticketId: defaultTicketId,
        })
        setValue('ticketId', defaultTicketId)
      } else {
        // Pre-fill user info even when there are no tickets
        reset({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          ticketId: '',
        })
      }
    }
  }, [isAuthenticated, user, event, reset, setValue])

  const fetchEvent = async () => {
    try {
      setFetchError(null)
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/public/${slug}`)
      if (tenantSlug) {
        url.searchParams.append('tenantSlug', tenantSlug)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.statusText}`)
      }

      const data = await response.json()
      setEvent(data.event)
      
      // Pre-fill form with user info if authenticated
      if (isAuthenticated() && user) {
        if (data.event?.tickets && data.event.tickets.length > 0) {
          const defaultTicketId = data.event.tickets[0].id
          reset({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ticketId: defaultTicketId,
          })
          setValue('ticketId', defaultTicketId)
        } else {
          // Pre-fill user info even when there are no tickets
          reset({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ticketId: '',
          })
        }
      } else {
        // For unauthenticated users, only set ticket if available
        if (data.event?.tickets && data.event.tickets.length > 0) {
          const defaultTicketId = data.event.tickets[0].id
          reset({
            ticketId: defaultTicketId,
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
          })
          setValue('ticketId', defaultTicketId)
        } else {
          reset({
            ticketId: '',
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
          })
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch event:', err)
      setFetchError(err.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: RegistrationForm) => {
    setRegistering(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!event || !event.id) {
        throw new Error('Event information is missing')
      }

      if (!event.tickets || event.tickets.length === 0) {
        throw new Error('No tickets available for this event')
      }

      if (!data.ticketId || data.ticketId.trim() === '') {
        throw new Error('Please select a ticket')
      }

      // Prepare registration data
      const registrationData: any = {
        eventId: event.id,
        ticketId: data.ticketId,
        email: data.email?.trim(),
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
      }

      // Add optional fields only if they have values
      if (data.phone?.trim()) {
        registrationData.phone = data.phone.trim()
      }

      // If user is authenticated, include userId
      if (isAuthenticated() && user) {
        registrationData.userId = user.id
      }

      console.log('Registering with data:', registrationData)

      // Use fetch directly for public registration endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      let responseData: any
      try {
        responseData = await response.json()
      } catch (e) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        // Handle different error response formats
        let errorMessage = 'Failed to register'
        if (responseData.error) {
          errorMessage = responseData.error
        } else if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          errorMessage = responseData.errors[0].msg || responseData.errors[0].message || errorMessage
        } else if (typeof responseData === 'string') {
          errorMessage = responseData
        }
        console.error('Registration error:', responseData)
        throw new Error(errorMessage)
      }

      // Show success message
      setSuccess(true)
      setError(null)

      // Handle payment if needed
      if (responseData.clientSecret) {
        // TODO: Integrate Stripe payment form here
        // For now, show success but note payment is pending
        console.log('Payment required. Client secret:', responseData.clientSecret)
      }

      // Fetch registration status to show registered state
      if (isAuthenticated() && user) {
        await checkRegistrationStatus()
      }

      // Don't reset if user is logged in, keep their info
      if (!isAuthenticated() || !user) {
        reset()
      } else {
        // Keep user info but reset ticket selection
        reset({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          ticketId: event.tickets?.[0]?.id || '',
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  // Render content based on authentication status
  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner size="md" />
    }

    if (fetchError || !event) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {fetchError || 'Event not found'}
          </p>
        </div>
      )
    }

    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl">
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h1>

            {/* Tenant Information */}
            {event.tenant && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border-l-4" style={{ borderLeftColor: event.tenant.primaryColor || '#3b82f6' }}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" style={{ color: event.tenant.primaryColor || '#3b82f6' }} />
                  Organizer
                </h2>
                <div className="flex items-center gap-4">
                  {event.tenant.logo ? (
                    <img
                      src={event.tenant.logo}
                      alt={event.tenant.name}
                      className="h-16 w-16 rounded-lg object-cover border-2"
                      style={{ borderColor: event.tenant.primaryColor || '#3b82f6' }}
                    />
                  ) : (
                    <div
                      className="h-16 w-16 rounded-lg flex items-center justify-center shadow-md"
                      style={{
                        background: event.tenant.primaryColor && event.tenant.secondaryColor
                          ? `linear-gradient(135deg, ${event.tenant.primaryColor}, ${event.tenant.secondaryColor})`
                          : event.tenant.primaryColor || '#3b82f6',
                      }}
                    >
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {event.tenant.name}
                    </h3>
                    {event.tenant.slug && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="h-4 w-4" />
                        <span>{event.tenant.slug}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{event.description}</p>
            </div>

            {event.agenda && event.agenda.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Agenda</h2>
                <div className="space-y-4">
                  {event.agenda.map((item: any) => (
                    <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(item.startTime), 'h:mm a')} - {format(new Date(item.endTime), 'h:mm a')}
                      </p>
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Details</h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Start:</span>{' '}
                  {format(new Date(event.startDate), 'MMMM d, yyyy h:mm a')}
                </p>
                <p>
                  <span className="font-medium">End:</span>{' '}
                  {format(new Date(event.endDate), 'MMMM d, yyyy h:mm a')}
                </p>
                {event.location && (
                  <p>
                    <span className="font-medium">Location:</span> {event.location}
                  </p>
                )}
                {event.onlineUrl && (
                  <p>
                    <span className="font-medium">Online URL:</span>{' '}
                    <a href={event.onlineUrl} className="text-blue-600 hover:underline">
                      {event.onlineUrl}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className={`p-6 rounded-lg shadow sticky top-6 transition-all duration-300 ${
              existingRegistration || success
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700'
                : 'bg-white dark:bg-gray-800'
            }`}>
              {existingRegistration || success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-green-900 dark:text-green-100">Registered!</h2>
                      <p className="text-sm text-green-700 dark:text-green-300">You're all set for this event</p>
                    </div>
                  </div>

                  {existingRegistration && (
                    <div className="space-y-3 bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <Ticket className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ticket</p>
                          <p className="text-sm text-gray-900 dark:text-white font-semibold">
                            {existingRegistration.ticket?.name || 'Standard Ticket'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Registered On</p>
                          <p className="text-sm text-gray-900 dark:text-white font-semibold">
                            {format(new Date(existingRegistration.registeredAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            existingRegistration.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : existingRegistration.status === 'CHECKED_IN'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : existingRegistration.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {existingRegistration.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAuthenticated() && (
                    <Link
                      href="/my-registrations"
                      className="block w-full text-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                    >
                      View My Registrations
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Register</h2>

                  {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {event.tickets && event.tickets.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ticket Type *
                    </label>
                    <select
                      {...register('ticketId', { 
                        required: 'Please select a ticket',
                        validate: (value) => value !== '' || 'Please select a ticket'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {event.tickets.map((ticket: any) => {
                        const isSoldOut = ticket.quantity !== null && ticket.sold >= ticket.quantity
                        return (
                          <option key={ticket.id} value={ticket.id} disabled={isSoldOut}>
                            {ticket.name} - ${parseFloat(ticket.price.toString()).toFixed(2)}
                            {isSoldOut ? ' (Sold Out)' : ''}
                          </option>
                        )
                      })}
                    </select>
                    {errors.ticketId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ticketId.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded">
                    No tickets available for this event.
                  </div>
                )}

                {isAuthenticated() && user && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded text-sm">
                    Registering as: {user.firstName} {user.lastName} ({user.email})
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      type="text"
                      readOnly={isAuthenticated() && user}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white read-only:opacity-50 read-only:cursor-not-allowed"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      type="text"
                      readOnly={isAuthenticated() && user}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white read-only:opacity-50 read-only:cursor-not-allowed"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                    type="email"
                    readOnly={isAuthenticated() && user}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white read-only:opacity-50 read-only:cursor-not-allowed"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm hover:shadow-md"
                    >
                      {registering ? 'Registering...' : 'Register Now'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Wait for mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner fullScreen size="lg" />
      </div>
    )
  }

  // If authenticated, use Layout
  if (isAuthenticated()) {
    return <Layout>{renderContent()}</Layout>
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
        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
