'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { User, Lock, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react'

interface SettingsForm {
  firstName: string
  lastName: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function SuperAdminSettingsPage() {
  const { isSuperAdmin, user } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettingsForm>()

  const newPassword = watch('newPassword')

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/login')
      return
    }
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
    }
    setLoading(false)
  }, [isSuperAdmin, router, user, reset])

  const onSubmitProfile = async (data: SettingsForm) => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await api.put('/api/user/profile', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const onSubmitPassword = async (data: SettingsForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await api.put('/api/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setSuccess(true)
      reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password')
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Platform Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Manage your super admin account settings
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <User className="h-5 w-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'password'
                    ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Lock className="h-5 w-5" />
                Password
              </button>
            </nav>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span>{activeTab === 'profile' ? 'Profile updated successfully!' : 'Password changed successfully!'}</span>
              </div>
            )}

            {activeTab === 'profile' ? (
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    {errors.lastName && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password *
                  </label>
                  <input
                    {...register('currentPassword', { required: 'Current password is required' })}
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  {errors.currentPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password *
                  </label>
                  <input
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  {errors.newPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (value) => value === newPassword || 'Passwords do not match',
                    })}
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Lock className="h-5 w-5" />
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
