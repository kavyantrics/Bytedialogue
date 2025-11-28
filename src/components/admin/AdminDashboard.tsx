'use client'

import { useState } from 'react'
import { trpc } from '@/app/_trpc/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UsersManagement from './UsersManagement'
import UsageAnalytics from './UsageAnalytics'
import AnalyticsDashboard from './AnalyticsDashboard'
import { Shield, Users, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  const { data: usageStats, isLoading: statsLoading } = trpc.adminGetUsageStats.useQuery({})

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-zinc-600">Manage users, monitor usage, and configure settings</p>
      </div>

      {/* Stats Overview */}
      {!statsLoading && usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-sm text-zinc-600">Total Users</h3>
            </div>
            <p className="text-2xl font-bold">{usageStats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-sm text-zinc-600">Total Tokens</h3>
            </div>
            <p className="text-2xl font-bold">{usageStats.totalTokens.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-sm text-zinc-600">Total Operations</h3>
            </div>
            <p className="text-2xl font-bold">{usageStats.totalOperations.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-sm text-zinc-600">Total Cost</h3>
            </div>
            <p className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>
        <TabsContent value="usage">
          <UsageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}

