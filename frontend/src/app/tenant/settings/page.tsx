'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Save } from 'lucide-react'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

interface SettingsForm {
  name: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  domain?: string
  allowPublicEvents: boolean
  requireApproval: boolean
  emailNotifications: boolean
  customDomain?: string
}

export default function SettingsPage() {
  const { isTenantUser, user, updateUser } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const isAdmin = user?.role === 'TENANT_ADMIN'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsForm>()

  useEffect(() => {
    if (!isTenantUser()) {
      router.push('/login')
      return
    }
    // Only admins can access settings
    if (!isAdmin) {
      router.push('/tenant')
      return
    }
    fetchProfile()
  }, [isTenantUser, isAdmin, router])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/tenant/profile')
      setTenant(response.data.tenant)
      reset({
        name: response.data.tenant.name,
        logo: response.data.tenant.logo || '',
        primaryColor: response.data.tenant.primaryColor || '#3B82F6',
        secondaryColor: response.data.tenant.secondaryColor || '#8B5CF6',
        domain: response.data.tenant.domain || '',
        allowPublicEvents: response.data.tenant.settings?.allowPublicEvents ?? true,
        requireApproval: response.data.tenant.settings?.requireApproval ?? false,
        emailNotifications: response.data.tenant.settings?.emailNotifications ?? true,
        customDomain: response.data.tenant.settings?.customDomain || '',
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await api.put('/api/tenant/profile', data)
      setSuccess(true)
      setTenant(response.data.tenant)
      
      // Update user in auth store with new tenant colors
      if (user && response.data.tenant) {
        updateUser({
          ...user,
          tenant: {
            ...user.tenant!,
            primaryColor: response.data.tenant.primaryColor,
            secondaryColor: response.data.tenant.secondaryColor,
            logo: response.data.tenant.logo,
            name: response.data.tenant.name,
          }
        })
      }
      
      fetchProfile()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded">
              Settings updated successfully!
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Organization Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo URL
                </label>
                <input
                  {...register('logo')}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Color
                  </label>
                  <input
                    {...register('primaryColor')}
                    type="color"
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Color
                  </label>
                  <input
                    {...register('secondaryColor')}
                    type="color"
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Domain
                </label>
                <input
                  {...register('domain')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  {...register('allowPublicEvents')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Allow Public Events
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('requireApproval')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Require Approval for Registrations
                </label>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
            <div className="flex items-center">
              <input
                {...register('emailNotifications')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Email Notifications
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Custom Domain</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Domain
              </label>
              <input
                {...register('customDomain')}
                type="text"
                placeholder="example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded disabled:opacity-50 transition-colors"
              style={{
                backgroundColor: user?.tenant?.primaryColor || '#3b82f6',
              }}
              onMouseEnter={(e) => {
                if (!saving && user?.tenant?.primaryColor) {
                  const rgb = hexToRgb(user.tenant.primaryColor)
                  if (rgb) {
                    e.currentTarget.style.backgroundColor = rgbToHex(
                      Math.max(0, rgb.r - 20),
                      Math.max(0, rgb.g - 20),
                      Math.max(0, rgb.b - 20)
                    )
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = user?.tenant?.primaryColor || '#3b82f6'
                }
              }}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
