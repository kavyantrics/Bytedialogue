import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { z } from 'zod'
import { requireAdmin, getUsers, updateUserStatus, updateUserRole, getUserStats } from '@/lib/admin'
import { getUsageStats, getCurrentMonthUsage } from '@/lib/usageTracking'

interface Context {
  db: typeof db
  userId: string | null
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  })
})

export const createContext = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  return {
    db,
    userId: user?.id || null,
  }
}

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
    }

    // Check if user exists in database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    })

    if (!dbUser) {
      // Create user if they don't exist
      await db.user.create({
        data: {
          id: user.id,
          email: user.email ?? '',
          firstName: user.given_name ?? '',
          lastName: user.family_name ?? '',
          profileImage: user.picture ?? '',
          kindeId: user.id,
          emailVerified: Boolean((user as { email_verified?: boolean }).email_verified),
          twoFactorEnabled: Boolean((user as { mfa_enabled?: boolean }).mfa_enabled),
        },
      })
    } else {
      // Update email verification and 2FA status
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: Boolean((user as { email_verified?: boolean }).email_verified),
          twoFactorEnabled: Boolean((user as { mfa_enabled?: boolean }).mfa_enabled),
        },
      })
    }

    return { success: true }
  }),

  getFiles: privateProcedure.query(async ({ ctx }) => {
    const files = await db.file.findMany({
      where: {
        userId: ctx.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        url: true,
      }
    })
    return files
  }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify file belongs to user
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId
        }
      })

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' })
      }

      await db.file.delete({
        where: {
          id: input.id
        }
      })

      return { success: true }
    }),

  getFileMessages: privateProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      fileId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { cursor, limit, fileId } = input

      // Fetch messages ordered by newest first (desc) for bottom-up chat
      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
          userId: ctx.userId
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc' // Newest first
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem!.id
      }

      // Reverse to get chronological order (oldest to newest) for display
      // This way newest messages appear at bottom
      const reversedMessages = [...messages].reverse()

      return {
        items: reversedMessages,
        nextCursor
      }
    }),

  getFile: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId
        }
      })

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      return file
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId
        },
        select: {
          uploadStatus: true
        }
      })

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      return file.uploadStatus
    }),

  // Usage tracking endpoints
  getCurrentUsage: privateProcedure.query(async ({ ctx }) => {
    return await getCurrentMonthUsage(ctx.userId)
  }),

  // Admin endpoints
  adminGetUsers: privateProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(['USER', 'ADMIN']).optional(),
      accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
    }))
    .query(async ({ input }) => {
      await requireAdmin()
      return await getUsers(input)
    }),

  adminGetUserStats: privateProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      await requireAdmin()
      return await getUserStats(input.userId)
    }),

  adminUpdateUserStatus: privateProcedure
    .input(z.object({
      userId: z.string(),
      status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
    }))
    .mutation(async ({ input }) => {
      await requireAdmin()
      return await updateUserStatus(input.userId, input.status)
    }),

  adminUpdateUserRole: privateProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['USER', 'ADMIN']),
    }))
    .mutation(async ({ input }) => {
      await requireAdmin()
      return await updateUserRole(input.userId, input.role)
    }),

  adminUpdateUserSubscription: privateProcedure
    .input(z.object({
      userId: z.string(),
      priceId: z.string().optional(),
      subscriptionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await requireAdmin()
      // Update user's subscription in database
      await db.user.update({
        where: { id: input.userId },
        data: {
          stripePriceId: input.priceId || null,
          stripeSubscriptionId: input.subscriptionId || null,
          stripeCurrentPeriodEnd: input.subscriptionId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days from now
        },
      })
      return { success: true }
    }),

  adminGetUsageStats: privateProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      await requireAdmin()
      return await getUsageStats(input.startDate, input.endDate)
    }),
})

export type AppRouter = typeof appRouter 