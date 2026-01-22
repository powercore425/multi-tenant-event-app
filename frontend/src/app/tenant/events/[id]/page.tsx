'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, X, Save, Edit, Trash2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Image from 'next/image'

interface TicketForm {
  name: string
  description?: string
  price: number
  quantity?: number
  saleStartDate?: string
  saleEndDate?: string
  status: string
}

export default function TenantEventViewPage() {
  const params = useParams()
  const router = useRouter()
  const { isTenantUser } = useAuthStore()
  const eventId = params?.id as string
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState<any>(null)
  const [ticketError, setTicketError] = useState<string | null>(null)

  const {
    register: registerTicket,
    handleSubmit: handleTicketSubmit,
    formState: { errors: ticketErrors },
    reset: resetTicket,
    setValue: setTicketValue,
  } = useForm<TicketForm>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: undefined,
      saleStartDate: '',
      saleEndDate: '',
      status: 'AVAILABLE',
    },
  })

  useEffect(() => {
    if (!isTenantUser()) {
      router.push('/login')
      return
    }
    fetchEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTenantUser, router, eventId])

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}`)
      setEvent(response.data.event)
    } catch (err: any) {
      console.error('Failed to fetch event:', err)
      setError(err.response?.data?.error || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (data: TicketForm) => {
    setTicketError(null)
    try {
      await api.post(`/api/events/${eventId}/tickets`, {
        ...data,
        price: parseFloat(data.price.toString()),
        quantity: data.quantity || null,
        saleStartDate: data.saleStartDate || null,
        saleEndDate: data.saleEndDate || null,
      })
      setShowTicketForm(false)
      resetTicket()
      fetchEvent()
    } catch (err: any) {
      setTicketError(err.response?.data?.error || 'Failed to create ticket')
    }
  }

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket)
    setShowTicketForm(true)
    setTicketValue('name', ticket.name)
    setTicketValue('description', ticket.description || '')
    setTicketValue('price', parseFloat(ticket.price.toString()))
    setTicketValue('quantity', ticket.quantity || undefined)
    setTicketValue('status', ticket.status)
    if (ticket.saleStartDate) {
      setTicketValue('saleStartDate', new Date(ticket.saleStartDate).toISOString().slice(0, 16))
    }
    if (ticket.saleEndDate) {
      setTicketValue('saleEndDate', new Date(ticket.saleEndDate).toISOString().slice(0, 16))
    }
  }

  const handleUpdateTicket = async (data: TicketForm) => {
    if (!editingTicket) return
    setTicketError(null)
    try {
      await api.put(`/api/events/${eventId}/tickets/${editingTicket.id}`, {
        ...data,
        price: parseFloat(data.price.toString()),
        quantity: data.quantity || null,
        saleStartDate: data.saleStartDate || null,
        saleEndDate: data.saleEndDate || null,
      })
      setShowTicketForm(false)
      setEditingTicket(null)
      resetTicket()
      fetchEvent()
    } catch (err: any) {
      setTicketError(err.response?.data?.error || 'Failed to update ticket')
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return
    try {
      await api.delete(`/api/events/${eventId}/tickets/${ticketId}`)
      fetchEvent()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete ticket')
    }
  }

  const handleCancelTicketForm = () => {
    setShowTicketForm(false)
    setEditingTicket(null)
    resetTicket()
    setTicketError(null)
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="md" />
      </Layout>
    )
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Event not found'}</p>
            <Link
              href="/tenant/events"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <Link
            href="/tenant/events"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 inline-block"
          >
            ← Back to Events
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
            <Link
              href={`/tenant/events/${eventId}/edit`}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              Edit Event
            </Link>
          </div>
        </div>

        {event.image && (
          <Image
            src={event.image}
            alt={event.title}
            width={1200}
            height={400}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{event.description || 'No description'}</p>
            </div>

            {event.agenda && event.agenda.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      event.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : event.status === 'DRAFT'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {event.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Start:</span>{' '}
                  {format(new Date(event.startDate), 'MMMM d, yyyy h:mm a')}
                </p>
                <p>
                  <span className="font-medium">End:</span>{' '}
                  {format(new Date(event.endDate), 'MMMM d, yyyy h:mm a')}
                </p>
                <p>
                  <span className="font-medium">Timezone:</span> {event.timezone}
                </p>
                <p>
                  <span className="font-medium">Location Type:</span> {event.locationType}
                </p>
                {event.location && (
                  <p>
                    <span className="font-medium">Location:</span> {event.location}
                  </p>
                )}
                {event.onlineUrl && (
                  <p>
                    <span className="font-medium">Online URL:</span>{' '}
                    <a href={event.onlineUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {event.onlineUrl}
                    </a>
                  </p>
                )}
                <p>
                  <span className="font-medium">Public Event:</span> {event.isPublic ? 'Yes' : 'No'}
                </p>
                {event.maxAttendees && (
                  <p>
                    <span className="font-medium">Max Attendees:</span> {event.maxAttendees}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Registrations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{event._count?.registrations || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-ins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{event._count?.checkIns || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Feedback</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{event._count?.feedback || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tickets</h2>
                <button
                  onClick={() => {
                    setEditingTicket(null)
                    resetTicket()
                    setShowTicketForm(!showTicketForm)
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  {showTicketForm ? 'Cancel' : '+ Add Ticket'}
                </button>
              </div>

              {showTicketForm && (
                <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
                  </h3>
                  {ticketError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                      {ticketError}
                    </div>
                  )}
                  <form
                    onSubmit={handleTicketSubmit(editingTicket ? handleUpdateTicket : handleCreateTicket)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ticket Name *
                      </label>
                      <input
                        {...registerTicket('name', { required: 'Ticket name is required' })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {ticketErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{ticketErrors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        {...registerTicket('description')}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price ($) *
                        </label>
                        <input
                          {...registerTicket('price', {
                            required: 'Price is required',
                            min: { value: 0, message: 'Price must be 0 or greater' },
                            valueAsNumber: true,
                          })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {ticketErrors.price && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{ticketErrors.price.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity (leave empty for unlimited)
                        </label>
                        <input
                          {...registerTicket('quantity', { valueAsNumber: true, min: { value: 1, message: 'Quantity must be at least 1' } })}
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {ticketErrors.quantity && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{ticketErrors.quantity.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sale Start Date
                        </label>
                        <input
                          {...registerTicket('saleStartDate')}
                          type="datetime-local"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sale End Date
                        </label>
                        <input
                          {...registerTicket('saleEndDate')}
                          type="datetime-local"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        {...registerTicket('status')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="SOLD_OUT">Sold Out</option>
                        <option value="HIDDEN">Hidden</option>
                      </select>
                    </div>

                    <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          <span>{editingTicket ? 'Update Ticket' : 'Create Ticket'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelTicketForm}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                    </div>
                  </form>
                </div>
              )}

              {event.tickets && event.tickets.length > 0 ? (
                <div className="space-y-3">
                  {event.tickets.map((ticket: any) => (
                    <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.name}</h3>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ticket.description}</p>
                          )}
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Price: <span className="font-medium">${parseFloat(ticket.price.toString()).toFixed(2)}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {ticket.quantity ? `${ticket.sold}/${ticket.quantity} sold` : `${ticket.sold} sold`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Status: <span className={`font-medium ${
                                ticket.status === 'AVAILABLE' ? 'text-green-600 dark:text-green-400' :
                                ticket.status === 'SOLD_OUT' ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>{ticket.status}</span>
                            </p>
                            {ticket.saleStartDate && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Sale starts: {format(new Date(ticket.saleStartDate), 'MMM d, yyyy h:mm a')}
                              </p>
                            )}
                            {ticket.saleEndDate && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Sale ends: {format(new Date(ticket.saleEndDate), 'MMM d, yyyy h:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditTicket(ticket)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !showTicketForm && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No tickets yet. Click &quot;Add Ticket&quot; to create one.
                  </p>
                )
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/tenant/registrations?eventId=${eventId}`}
                  className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                >
                  View Registrations
                </Link>
                <Link
                  href={`/tenant/events/${eventId}/edit`}
                  className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
                >
                  Edit Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
