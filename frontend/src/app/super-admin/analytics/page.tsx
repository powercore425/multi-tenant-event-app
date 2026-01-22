'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { Building2, Users, Calendar, TrendingUp, Activity, DollarSign, Shield, AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export default function AnalyticsPage() {
  const { isSuperAdmin } = useAuthStore()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/login')
      return
    }
    fetchAnalytics()
  }, [isSuperAdmin, router, dateRange])

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      
      const response = await api.get(`/api/super-admin/analytics?${params.toString()}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
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

  const tenantsByPlanData = analytics?.tenantsByPlan?.map((item: any) => ({
    name: item.planType || 'Free',
    value: item._count,
  })) || []

  const tenantsByStatusData = analytics?.tenantsByStatus?.map((item: any) => ({
    name: item.status,
    value: item._count,
  })) || []

  const usersByRoleData = analytics?.usersByRole?.map((item: any) => ({
    name: item.role.replace('_', ' '),
    value: item._count,
  })) || []

  const eventsByStatusData = analytics?.eventsByStatus?.map((item: any) => ({
    name: item.status,
    value: item._count,
  })) || []

  const registrationsByStatusData = analytics?.registrationsByStatus?.map((item: any) => ({
    name: item.status,
    value: item._count,
  })) || []

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Activity className="h-10 w-10" />
                Platform Analytics
              </h1>
              <p className="text-indigo-100 text-lg">
                Comprehensive insights into your platform performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="End Date"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 text-purple-600" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                Total
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tenants</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalTenants || 0}</p>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="text-green-600 dark:text-green-400">Active: {analytics?.activeTenants || 0}</span>
              <span className="text-gray-400">|</span>
              <span className="text-red-600 dark:text-red-400">Suspended: {analytics?.suspendedTenants || 0}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                All Roles
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalUsers || 0}</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Excluding Super Admins
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-indigo-600" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                All Events
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Events</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalEvents || 0}</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Across all tenants
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                Total
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Registrations</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalRegistrations || 0}</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Event registrations
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tenants by Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Tenants by Plan
            </h3>
            {tenantsByPlanData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tenantsByPlanData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tenantsByPlanData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Tenants by Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Tenants by Status
            </h3>
            {tenantsByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tenantsByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Users by Role */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Users by Role
            </h3>
            {usersByRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usersByRoleData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Events by Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Events by Status
            </h3>
            {eventsByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventsByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registrations by Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Registrations by Status
            </h3>
            {registrationsByStatusData.length > 0 ? (
              <div className="space-y-4">
                {registrationsByStatusData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Top Tenants by Events */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Top Tenants by Events
            </h3>
            {analytics?.topTenantsByEvents && analytics.topTenantsByEvents.length > 0 ? (
              <div className="space-y-3">
                {analytics.topTenantsByEvents.map((tenant: any, index: number) => (
                  <Link
                    key={tenant.id}
                    href={`/super-admin/tenants/${tenant.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {tenant.planType} • {tenant._count?.events || 0} events
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Top Tenants by Users */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Top Tenants by Users
            </h3>
            {analytics?.topTenantsByUsers && analytics.topTenantsByUsers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topTenantsByUsers.map((tenant: any, index: number) => (
                  <Link
                    key={tenant.id}
                    href={`/super-admin/tenants/${tenant.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {tenant.planType} • {tenant._count?.users || 0} users
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Recent Tenants
          </h3>
          {analytics?.recentTenants && analytics.recentTenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Users / Events
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.recentTenants.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tenant.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(tenant.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/super-admin/tenants/${tenant.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
              No recent tenants
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
