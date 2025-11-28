'use client'

import { trpc } from '@/app/_trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, DollarSign, Activity } from 'lucide-react'

export default function UsageAnalytics() {
  const { data: stats, isLoading } = trpc.adminGetUsageStats.useQuery({})

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalTokens.toLocaleString() || 0}</p>
            <p className="text-sm text-zinc-500 mt-2">All-time token usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${stats?.totalCost.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-zinc-500 mt-2">All-time API costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Total Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalOperations.toLocaleString() || 0}</p>
            <p className="text-sm text-zinc-500 mt-2">AI operations performed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Total Users</span>
              <span className="font-semibold">{stats?.totalUsers.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Average Tokens per User</span>
              <span className="font-semibold">
                {stats && stats.totalUsers > 0
                  ? Math.round(stats.totalTokens / stats.totalUsers).toLocaleString()
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Average Cost per User</span>
              <span className="font-semibold">
                ${stats && stats.totalUsers > 0
                  ? (stats.totalCost / stats.totalUsers).toFixed(4)
                  : '0.0000'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

