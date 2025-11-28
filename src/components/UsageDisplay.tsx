'use client'

import { trpc } from '@/app/_trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, MessageSquare, Zap, DollarSign } from 'lucide-react'
import { getUserSubscriptionPlan } from '@/lib/stripe'

interface UsageDisplayProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

export default function UsageDisplay({ subscriptionPlan }: UsageDisplayProps) {
  const { data: usage, isLoading } = trpc.getCurrentUsage.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const tokensPercentage = usage
    ? Math.min((usage.tokensUsed / subscriptionPlan.tokensPerMonth) * 100, 100)
    : 0
  const filesPercentage = usage
    ? Math.min((usage.fileCount / subscriptionPlan.quota) * 100, 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Tokens</span>
            </div>
            <span className="text-sm text-zinc-600">
              {usage?.tokensUsed.toLocaleString() || 0} / {subscriptionPlan.tokensPerMonth.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${tokensPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Files</span>
            </div>
            <span className="text-sm text-zinc-600">
              {usage?.fileCount || 0} / {subscriptionPlan.quota}
            </span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${filesPercentage}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Messages</span>
            </div>
            <span className="text-sm text-zinc-600">{usage?.messageCount || 0}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">This Month Cost</span>
            </div>
            <span className="text-sm font-semibold">${usage?.cost.toFixed(4) || '0.0000'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

