"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function TenantDashboard() {
  const { isTenantUser, user } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "TENANT_ADMIN";

  useEffect(() => {
    if (!isTenantUser()) {
      router.push("/login");
      return;
    }

    fetchAnalytics();
  }, [isTenantUser, router]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/api/tenant/analytics");
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="md" />
      </Layout>
    );
  }

  const eventsByStatusData =
    analytics?.eventsByStatus?.map((item: any) => ({
      name: item.status,
      value: item._count,
    })) || [];

  const stats = [
    {
      name: "Total Events",
      value: analytics?.totalEvents || 0,
      icon: Calendar,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      name: "Published Events",
      value: analytics?.publishedEvents || 0,
      icon: Activity,
      color: "bg-green-500",
      change: "+8%",
    },
    {
      name: "Total Registrations",
      value: analytics?.totalRegistrations || 0,
      icon: Users,
      color: "bg-purple-500",
      change: "+24%",
    },
    {
      name: "Total Attendees",
      value: analytics?.totalAttendees || 0,
      icon: Ticket,
      color: "bg-indigo-500",
      change: "+18%",
    },
    {
      name: "Total Revenue",
      value: `$${parseFloat(analytics?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      change: "+32%",
    },
    {
      name: "Conversion Rate",
      value:
        analytics?.totalRegistrations > 0
          ? `${((analytics?.totalAttendees / analytics?.totalRegistrations) * 100).toFixed(1)}%`
          : "0%",
      icon: TrendingUp,
      color: "bg-amber-500",
      change: "+5%",
    },
  ];

  return (
    <Layout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isAdmin
              ? "Overview of your events and registrations"
              : "View your assigned events and registrations"}
          </p>
        </div>

        {/* Limited access notice for tenant users */}
        {!isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Limited Access:</strong> You have view-only access to
              events and registrations. Contact your tenant administrator for
              full access or to make changes.
            </p>
          </div>
        )}

        {/* Stats Grid - Limited for tenant users */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats
            .filter((stat) => {
              // Tenant users only see basic stats
              if (!isAdmin) {
                return [
                  "Total Events",
                  "Published Events",
                  "Total Registrations",
                  "Total Attendees",
                ].includes(stat.name);
              }
              return true;
            })
            .map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {stat.change}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          vs last month
                        </span>
                      </div>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Events by Status Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Events by Status
            </h3>
            {eventsByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventsByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent ?? 0 * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventsByStatusData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
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

          {/* Registration Overview Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Registration Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: "Total", value: analytics?.totalRegistrations || 0 },
                  { name: "Attendees", value: analytics?.totalAttendees || 0 },
                  {
                    name: "Pending",
                    value:
                      (analytics?.totalRegistrations || 0) -
                      (analytics?.totalAttendees || 0),
                  },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="name"
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats - Admin only */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-90 mb-2">
                Event Performance
              </h3>
              <p className="text-3xl font-bold">
                {analytics?.totalEvents > 0
                  ? (
                      (analytics?.publishedEvents / analytics?.totalEvents) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-sm opacity-75 mt-1">Publish Rate</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-90 mb-2">
                Average Attendance
              </h3>
              <p className="text-3xl font-bold">
                {analytics?.totalEvents > 0
                  ? Math.round(
                      (analytics?.totalAttendees || 0) / analytics?.totalEvents,
                    )
                  : 0}
              </p>
              <p className="text-sm opacity-75 mt-1">Per Event</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-90 mb-2">
                Revenue per Event
              </h3>
              <p className="text-3xl font-bold">
                $
                {analytics?.totalEvents > 0
                  ? (
                      parseFloat(analytics?.totalRevenue || 0) /
                      analytics?.totalEvents
                    ).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-sm opacity-75 mt-1">Average</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
