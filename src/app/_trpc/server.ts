import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { z } from 'zod'
import { requireAdmin, getUsers, updateUserStatus, updateUserRole, getUserStats } from '@/lib/admin'
import { getUsageStats, getCurrentMonthUsage } from '@/lib/usageTracking'
import { getActiveUsers, getUploadTrends, getTokenUsageByPlan, getRevenueMetrics } from '@/lib/analytics'
import Stripe from 'stripe'

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

  // Stripe subscription
  createStripeSession: privateProcedure.mutation(async () => {
    try {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user || !user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.',
        })
      }

      if (!process.env.STRIPE_PRICE_ID) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe price ID not configured. Please set STRIPE_PRICE_ID in your environment variables.',
        })
      }

      // Validate that it's a price ID, not a product ID
      if (!process.env.STRIPE_PRICE_ID.startsWith('price_')) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Invalid Stripe Price ID format. Price IDs must start with "price_". You provided: "${process.env.STRIPE_PRICE_ID}". This looks like a Product ID (starts with "prod_"). Please get the Price ID from your Stripe dashboard: Products → Your Product → Pricing → Copy Price ID.`,
        })
      }

      // Initialize Stripe client
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-04-30.basil',
      })

      // Ensure URL has proper scheme
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const successUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
        ? `${baseUrl}/dashboard?success=true`
        : `http://${baseUrl}/dashboard?success=true`
      const cancelUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
        ? `${baseUrl}/dashboard?canceled=true`
        : `http://${baseUrl}/dashboard?canceled=true`

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ['card'],
        mode: 'subscription',
        billing_address_collection: 'auto',
        customer_email: user.email ?? undefined,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
        },
      })

      if (!session.url) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create Stripe checkout session',
        })
      }

      return { url: session.url }
    } catch (error) {
      console.error('Error creating Stripe session:', error)
      if (error instanceof TRPCError) {
        throw error
      }
      if (error instanceof Stripe.errors.StripeError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Stripe error: ${error.message}`,
        })
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create Stripe session',
      })
    }
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
      try {
        return await getUsageStats(input.startDate, input.endDate)
      } catch (error) {
        console.error('[TRPC] Error in adminGetUsageStats:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch usage statistics',
          cause: error,
        })
      }
    }),

  // Analytics endpoints
  adminGetActiveUsers: privateProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      await requireAdmin()
      return await getActiveUsers(input.days)
    }),

  adminGetUploadTrends: privateProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      await requireAdmin()
      return await getUploadTrends(input.days)
    }),

  adminGetTokenUsageByPlan: privateProcedure
    .query(async () => {
      await requireAdmin()
      return await getTokenUsageByPlan()
    }),

  adminGetRevenueMetrics: privateProcedure
    .query(async () => {
      await requireAdmin()
      return await getRevenueMetrics()
    }),
})

export type AppRouter = typeof appRouter 