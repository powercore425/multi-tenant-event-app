'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Ban, CheckCircle, Trash2, Edit, Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function TenantsPage() {
  const { isSuperAdmin } = useAuthStore()
  const router = useRouter()
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/login')
      return
    }
    fetchTenants()
  }, [isSuperAdmin, router])

  const fetchTenants = async () => {
    try {
      const response = await api.get('/api/super-admin/tenants', {
        params: { search, limit: 50 },
      })
      setTenants(response.data.tenants || [])
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (search !== undefined) {
      fetchTenants()
    }
  }, [search])

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return
    try {
      await api.post(`/api/super-admin/tenants/${id}/suspend`)
      fetchTenants()
    } catch (error) {
      console.error('Failed to suspend tenant:', error)
      alert('Failed to suspend tenant')
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/api/super-admin/tenants/${id}/activate`)
      fetchTenants()
    } catch (error) {
      console.error('Failed to activate tenant:', error)
      alert('Failed to activate tenant')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return
    try {
      await api.delete(`/api/super-admin/tenants/${id}`)
      fetchTenants()
    } catch (error) {
      console.error('Failed to delete tenant:', error)
      alert('Failed to delete tenant')
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <Link
            href="/super-admin/tenants/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Tenant</span>
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Users / Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tenant.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : tenant.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {tenant.planType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {tenant._count?.users || 0} / {tenant._count?.events || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                      {tenant.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleSuspend(tenant.id)}
                          className="inline-flex items-center gap-1.5 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 transition-colors"
                        >
                          <Ban className="h-4 w-4" />
                          <span>Suspend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(tenant.id)}
                          className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 dark:text-green-400 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Activate</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-900 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tenant.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Slug: {tenant.slug}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : tenant.status === 'SUSPENDED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tenant.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Plan:</span> {tenant.planType}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Users / Events:</span> {tenant._count?.users || 0} / {tenant._count?.events || 0}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
                {tenant.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleSuspend(tenant.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm transition-colors"
                  >
                    <Ban className="h-4 w-4" />
                    <span>Suspend</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(tenant.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Activate</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(tenant.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tenants found</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
