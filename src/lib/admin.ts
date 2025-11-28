import { db } from '@/lib/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { TRPCError } from '@trpc/server'

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  })

  return user?.role === 'ADMIN'
}

// Require admin access (throws if not admin)
export async function requireAdmin(): Promise<string> {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }

  const isUserAdmin = await isAdmin(user.id)
  if (!isUserAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }

  return user.id
}

// Get all users with pagination
export async function getUsers(params: {
  page?: number
  limit?: number
  search?: string
  role?: 'USER' | 'ADMIN'
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
}) {
  const page = params.page || 1
  const limit = params.limit || 20
  const skip = (page - 1) * limit

  const where: {
    role?: 'USER' | 'ADMIN'
    accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
    OR?: Array<{
      email?: { contains: string }
      firstName?: { contains: string }
      lastName?: { contains: string }
    }>
  } = {}

  if (params.role) where.role = params.role
  if (params.accountStatus) where.accountStatus = params.accountStatus

  if (params.search) {
    where.OR = [
      { email: { contains: params.search } },
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
        _count: {
          select: {
            files: true,
            messages: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ])

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Update user account status
export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
) {
  return await db.user.update({
    where: { id: userId },
    data: { accountStatus: status },
  })
}

// Update user role
export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  return await db.user.update({
    where: { id: userId },
    data: { role },
  })
}

// Get user statistics
export async function getUserStats(userId: string) {
  const [fileCount, messageCount, usage] = await Promise.all([
    db.file.count({ where: { userId } }),
    db.message.count({ where: { userId } }),
    db.usageRecord.aggregate({
      where: { userId },
      _sum: {
        tokensUsed: true,
        cost: true,
      },
    }),
  ])

  return {
    fileCount,
    messageCount,
    totalTokensUsed: usage._sum.tokensUsed || 0,
    totalCost: usage._sum.cost || 0,
  }
}

