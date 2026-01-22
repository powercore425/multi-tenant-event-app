'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Building2, Users, Calendar, Mail, Globe, Palette, Settings, ArrowLeft } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function TenantViewPage() {
  const { isSuperAdmin } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/login')
      return
    }
    fetchTenant()
  }, [isSuperAdmin, router, tenantId])

  const fetchTenant = async () => {
    try {
      const response = await api.get(`/api/super-admin/tenants/${tenantId}`)
      setTenant(response.data.tenant)
    } catch (err: any) {
      console.error('Failed to fetch tenant:', err)
      setError(err.response?.data?.error || 'Failed to load tenant')
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

  if (error || !tenant) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Tenant not found'}</p>
          <Link
            href="/super-admin/tenants"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Tenants
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <Link
            href="/super-admin/tenants"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tenant Details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : tenant.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Type</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.planType}</p>
                </div>
                {tenant.domain && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      {tenant.domain}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(tenant.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Limits & Usage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Events</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {tenant._count?.events || 0} / {tenant.maxEvents}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Users</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {tenant._count?.users || 0} / {tenant.maxUsers}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Attendees</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.maxAttendees}</p>
                </div>
              </div>
            </div>

            {/* Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Users ({tenant.users?.length || 0})
              </h2>
              {tenant.users && tenant.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tenant.users.map((user: any) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Branding */}
            {(tenant.logo || tenant.primaryColor || tenant.secondaryColor) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Branding
                </h2>
                {tenant.logo && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Logo</label>
                    <img src={tenant.logo} alt={tenant.name} className="mt-2 h-16 w-auto" />
                  </div>
                )}
                {tenant.primaryColor && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Color</label>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: tenant.primaryColor }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{tenant.primaryColor}</span>
                    </div>
                  </div>
                )}
                {tenant.secondaryColor && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Secondary Color</label>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: tenant.secondaryColor }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{tenant.secondaryColor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tenant._count?.events || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tenant._count?.users || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
