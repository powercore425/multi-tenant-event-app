'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Save, Building2, Palette, Bell, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

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
        <LoadingSpinner size="md" />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-2">
            Tenant Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization settings and branding
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {/* Organization Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Profile</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Logo URL
                </label>
                <input
                  {...register('logo')}
                  type="url"
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('primaryColor')}
                      type="color"
                      className="w-20 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      {...register('primaryColor')}
                      type="text"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('secondaryColor')}
                      type="color"
                      className="w-20 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      {...register('secondaryColor')}
                      type="text"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Domain
                </label>
                <input
                  {...register('domain')}
                  type="text"
                  placeholder="your-domain"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Event Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Settings</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  {...register('allowPublicEvents')}
                  type="checkbox"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">Allow Public Events</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Make events visible to all users</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  {...register('requireApproval')}
                  type="checkbox"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">Require Approval for Registrations</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Manually approve event registrations</span>
                </div>
              </label>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
            </div>
            <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
              <input
                {...register('emailNotifications')}
                type="checkbox"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">Email Notifications</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Receive email updates about events and registrations</span>
              </div>
            </label>
          </div>

          {/* Custom Domain Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Domain</h2>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Custom Domain
              </label>
              <input
                {...register('customDomain')}
                type="text"
                placeholder="example.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Configure your custom domain to host events on your own domain
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              style={!saving && user?.tenant?.primaryColor && user?.tenant?.secondaryColor ? {
                background: `linear-gradient(to right, ${user.tenant.primaryColor}, ${user.tenant.secondaryColor})`,
              } : {}}
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
