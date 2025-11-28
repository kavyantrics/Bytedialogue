import { db } from '@/lib/db'
import { PLANS } from '@/config/stripe'

// Get active users count (users who have activity in last 30 days)
export async function getActiveUsers(days: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const activeUsers = await db.user.count({
    where: {
      OR: [
        {
          files: {
            some: {
              createdAt: {
                gte: cutoffDate,
              },
            },
          },
        },
        {
          messages: {
            some: {
              createdAt: {
                gte: cutoffDate,
              },
            },
          },
        },
      ],
    },
  })

  return activeUsers
}

// Get PDF upload trends (uploads per day for last N days)
export async function getUploadTrends(days: number = 30): Promise<Array<{ date: string; count: number }>> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const uploads = await db.file.findMany({
    where: {
      createdAt: {
        gte: cutoffDate,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by date
  const trends: Record<string, number> = {}
  uploads.forEach((upload) => {
    const date = upload.createdAt.toISOString().split('T')[0]
    trends[date] = (trends[date] || 0) + 1
  })

  // Fill in missing dates with 0
  const result: Array<{ date: string; count: number }> = []
  for (let i = 0; i < days; i++) {
    const date = new Date(cutoffDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      count: trends[dateStr] || 0,
    })
  }

  return result
}

// Get token usage by plan
export async function getTokenUsageByPlan(): Promise<Array<{ plan: string; tokens: number; users: number }>> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Get all users with their plans
  const users = await db.user.findMany({
    where: {
      stripePriceId: {
        not: null,
      },
    },
    select: {
      id: true,
      stripePriceId: true,
    },
  })

  // Group users by plan
  const planGroups: Record<string, string[]> = {}
  users.forEach((user) => {
    const plan = PLANS.find((p) => p.price.priceIds.test === user.stripePriceId)
    const planName = plan?.name || 'Free'
    if (!planGroups[planName]) {
      planGroups[planName] = []
    }
    planGroups[planName].push(user.id)
  })

  // Get usage for each plan
  const result: Array<{ plan: string; tokens: number; users: number }> = []
  for (const [planName, userIds] of Object.entries(planGroups)) {
    const usage = await db.usageRecord.aggregate({
      where: {
        userId: {
          in: userIds,
        },
        month,
        year,
      },
      _sum: {
        tokensUsed: true,
      },
    })

    result.push({
      plan: planName,
      tokens: usage._sum.tokensUsed || 0,
      users: userIds.length,
    })
  }

  // Add Free plan users
  const freeUsers = await db.user.findMany({
    where: {
      OR: [
        { stripePriceId: null },
        { stripePriceId: '' },
      ],
    },
    select: {
      id: true,
    },
  })

  if (freeUsers.length > 0) {
    const freeUsage = await db.usageRecord.aggregate({
      where: {
        userId: {
          in: freeUsers.map((u) => u.id),
        },
        month,
        year,
      },
      _sum: {
        tokensUsed: true,
      },
    })

    result.push({
      plan: 'Free',
      tokens: freeUsage._sum.tokensUsed || 0,
      users: freeUsers.length,
    })
  }

  return result
}

// Get revenue metrics from Stripe (requires Stripe integration)
export async function getRevenueMetrics(): Promise<{
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  totalRevenue: number
  activeSubscriptions: number
}> {
  // Get all Pro users
  const proUsers = await db.user.findMany({
    where: {
      stripePriceId: {
        not: null,
      },
      stripeCurrentPeriodEnd: {
        gte: new Date(),
      },
    },
  })

  const proPlan = PLANS.find((p) => p.name === 'Pro')
  const mrr = proUsers.length * (proPlan?.price.amount || 0)
  const arr = mrr * 12

  // Calculate total revenue (simplified - would need Stripe API for accurate data)
  const totalRevenue = mrr * 12 // Estimate based on current MRR

  return {
    mrr,
    arr,
    totalRevenue,
    activeSubscriptions: proUsers.length,
  }
}

