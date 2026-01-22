'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Building2, Users, Calendar, TrendingUp, Activity, DollarSign, Shield, Zap, Globe } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function SuperAdminDashboard() {
  const { isSuperAdmin } = useAuthStore()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/login')
      return
    }

    fetchAnalytics()
  }, [isSuperAdmin, router])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/super-admin/analytics')
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
        <LoadingSpinner size="md" />
      </Layout>
    )
  }

  const tenantsByPlanData = analytics?.tenantsByPlan?.map((item: any) => ({
    name: item.planType || 'Free',
    value: item._count,
  })) || []

  const stats = [
    {
      name: 'Total Tenants',
      value: analytics?.totalTenants || 0,
      icon: Building2,
      color: 'bg-blue-500',
      change: '+15%',
    },
    {
      name: 'Active Tenants',
      value: analytics?.activeTenants || 0,
      icon: Activity,
      color: 'bg-green-500',
      change: '+12%',
    },
    {
      name: 'Total Users',
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
      change: '+28%',
    },
    {
      name: 'Total Events',
      value: analytics?.totalEvents || 0,
      icon: Calendar,
      color: 'bg-indigo-500',
      change: '+35%',
    },
    {
      name: 'Total Registrations',
      value: analytics?.totalRegistrations || 0,
      icon: TrendingUp,
      color: 'bg-amber-500',
      change: '+42%',
    },
    {
      name: 'Active Rate',
      value: analytics?.totalTenants > 0
        ? `${((analytics?.activeTenants / analytics?.totalTenants) * 100).toFixed(1)}%`
        : '0%',
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+3%',
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Shield className="h-10 w-10" />
                Platform Dashboard
              </h1>
              <p className="text-purple-100 text-lg">
                Complete overview of your multi-tenant platform
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/super-admin/tenants"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold transition-all border border-white/30"
              >
                Manage Tenants
              </Link>
              <Link
                href="/super-admin/analytics"
                className="px-6 py-3 bg-white text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition-all"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const gradientColors = [
              'from-blue-500 to-blue-600',
              'from-green-500 to-green-600',
              'from-purple-500 to-purple-600',
              'from-indigo-500 to-indigo-600',
              'from-amber-500 to-amber-600',
              'from-emerald-500 to-emerald-600',
            ]
            return (
              <div
                key={stat.name}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} opacity-10 rounded-full -mr-16 -mt-16 group-hover:opacity-20 transition-opacity`} />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">vs last month</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Grid - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tenants by Plan Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Tenants by Plan
              </h3>
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
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

          {/* Platform Overview Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Platform Overview
              </h3>
              <Zap className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Tenants', value: analytics?.totalTenants || 0 },
                  { name: 'Active', value: analytics?.activeTenants || 0 },
                  { name: 'Users', value: analytics?.totalUsers || 0 },
                  { name: 'Events', value: analytics?.totalEvents || 0 },
                  { name: 'Registrations', value: analytics?.totalRegistrations || 0 },
                ]}
              >
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
          </div>
        </div>

        {/* Additional Stats - Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 opacity-90" />
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Growth</span>
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-2">Active Rate</h3>
              <p className="text-4xl font-bold mb-1">
                {analytics?.totalTenants > 0
                  ? ((analytics?.activeTenants / analytics?.totalTenants) * 100).toFixed(0)
                  : 0}%
              </p>
              <p className="text-sm opacity-75">Tenant Engagement</p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 opacity-90" />
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Average</span>
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-2">Users per Tenant</h3>
              <p className="text-4xl font-bold mb-1">
                {analytics?.totalTenants > 0
                  ? Math.round((analytics?.totalUsers || 0) / analytics?.totalTenants)
                  : 0}
              </p>
              <p className="text-sm opacity-75">Platform Adoption</p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 opacity-90" />
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Average</span>
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-2">Events per Tenant</h3>
              <p className="text-4xl font-bold mb-1">
                {analytics?.totalTenants > 0
                  ? Math.round((analytics?.totalEvents || 0) / analytics?.totalTenants)
                  : 0}
              </p>
              <p className="text-sm opacity-75">Event Activity</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
