import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { z } from 'zod'

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
        select: {
          id: true,
          text: true,
          isUserMessage: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          fileId: true,
          followUpSuggestions: true, // Include follow-up suggestions
        }
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
    })
})

export type AppRouter = typeof appRouter 