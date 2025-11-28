import { db } from '@/lib/db'
import { PLANS } from '@/config/stripe'
import { getUserSubscriptionPlan as getPlan } from '@/lib/stripe'

// OpenAI pricing (as of 2024) - update as needed
const PRICING = {
  'gpt-3.5-turbo': {
    prompt: 0.0005 / 1000, // $0.50 per 1M tokens
    completion: 0.0015 / 1000, // $1.50 per 1M tokens
  },
  'gpt-4': {
    prompt: 0.03 / 1000, // $30 per 1M tokens
    completion: 0.06 / 1000, // $60 per 1M tokens
  },
  'text-embedding-3-small': {
    prompt: 0.02 / 1000, // $0.20 per 1M tokens
    completion: 0,
  },
  'whisper-1': {
    prompt: 0.006 / 60, // $0.006 per minute
    completion: 0,
  },
}

// Calculate cost based on model and token usage
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number = 0
): number {
  const pricing = PRICING[model as keyof typeof PRICING]
  if (!pricing) {
    console.warn(`Unknown model pricing for: ${model}`)
    return 0
  }

  const promptCost = promptTokens * pricing.prompt
  const completionCost = completionTokens * pricing.completion
  return promptCost + completionCost
}

// Record usage in database
export async function recordUsage(params: {
  userId: string
  tokensUsed: number
  promptTokens: number
  completionTokens: number
  cost: number
  operationType: 'chat' | 'summary' | 'embedding' | 'transcription'
  model: string
  fileId?: string
  messageId?: string
}): Promise<void> {
  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    await db.usageRecord.create({
      data: {
        userId: params.userId,
        tokensUsed: params.tokensUsed,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        cost: params.cost,
        operationType: params.operationType,
        fileId: params.fileId,
        messageId: params.messageId,
        month,
        year,
      },
    })
  } catch (error) {
    console.error('[USAGE_TRACKING] Error recording usage:', error)
    // Don't throw - usage tracking shouldn't break the app
  }
}

// Get current month usage for a user
export async function getCurrentMonthUsage(userId: string): Promise<{
  tokensUsed: number
  cost: number
  fileCount: number
  messageCount: number
}> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const usage = await db.usageRecord.aggregate({
    where: {
      userId,
      month,
      year,
    },
    _sum: {
      tokensUsed: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  })

  const fileCount = await db.file.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  })

  const messageCount = await db.message.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  })

  return {
    tokensUsed: usage._sum.tokensUsed || 0,
    cost: usage._sum.cost || 0,
    fileCount,
    messageCount,
  }
}

// Check if user has exceeded limits
export async function checkUsageLimits(userId: string): Promise<{
  allowed: boolean
  reason?: string
  tokensRemaining?: number
  filesRemaining?: number
}> {
  const plan = await getPlan()
  const usage = await getCurrentMonthUsage(userId)

  // Check token limit
  if (usage.tokensUsed >= plan.tokensPerMonth) {
    return {
      allowed: false,
      reason: `Token limit reached. You've used ${usage.tokensUsed.toLocaleString()} of ${plan.tokensPerMonth.toLocaleString()} tokens this month.`,
      tokensRemaining: 0,
    }
  }

  // Check file upload limit
  if (usage.fileCount >= plan.quota) {
    return {
      allowed: false,
      reason: `File upload limit reached. You've uploaded ${usage.fileCount} of ${plan.quota} files this month.`,
      filesRemaining: 0,
    }
  }

  return {
    allowed: true,
    tokensRemaining: plan.tokensPerMonth - usage.tokensUsed,
    filesRemaining: plan.quota - usage.fileCount,
  }
}

// Get usage statistics for admin
export async function getUsageStats(startDate?: Date, endDate?: Date) {
  const where: {
    createdAt?: {
      gte?: Date
      lte?: Date
    }
  } = {}

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const stats = await db.usageRecord.aggregate({
    where,
    _sum: {
      tokensUsed: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  })

  const userCount = await db.user.count({
    where: {
      createdAt: startDate || endDate
        ? {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          }
        : undefined,
    },
  })

  return {
    totalTokens: stats._sum.tokensUsed || 0,
    totalCost: stats._sum.cost || 0,
    totalOperations: stats._count.id || 0,
    totalUsers: userCount,
  }
}

