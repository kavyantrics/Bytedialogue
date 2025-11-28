'use client'

import { useState } from 'react'
import { trpc } from '@/app/_trpc/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, User, FileText, MessageSquare, Zap, DollarSign } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PLANS } from '@/config/stripe'
import { useToast } from '@/components/ui/use-toast'

interface UserDetailModalProps {
  userId: string
  open: boolean
  onClose: () => void
}

export default function UserDetailModal({ userId, open, onClose }: UserDetailModalProps) {
  const { data: stats, isLoading } = trpc.adminGetUserStats.useQuery(
    { userId },
    { enabled: open }
  )
  const { toast } = useToast()

  const { mutate: updateSubscription } = trpc.adminUpdateUserSubscription.useMutation({
    onSuccess: () => {
      toast({ title: 'Subscription updated successfully' })
    },
    onError: (error) => {
      toast({
        title: 'Failed to update subscription',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handlePlanChange = (priceId: string) => {
    updateSubscription({
      userId,
      priceId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-zinc-600">Files</span>
                </div>
                <p className="text-2xl font-bold">{stats?.fileCount || 0}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-zinc-600">Messages</span>
                </div>
                <p className="text-2xl font-bold">{stats?.messageCount || 0}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-zinc-600">Tokens</span>
                </div>
                <p className="text-2xl font-bold">{stats?.totalTokensUsed.toLocaleString() || 0}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-zinc-600">Cost</span>
                </div>
                <p className="text-2xl font-bold">${stats?.totalCost.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Subscription Management */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Subscription Plan</h3>
              <Select onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.slug} value={plan.price.priceIds.test || ''}>
                      {plan.name} - ${plan.price.amount}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

