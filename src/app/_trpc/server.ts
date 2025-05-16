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
  getFiles: privateProcedure.query(async ({ ctx }) => {
    const files = await db.file.findMany({
      where: {
        userId: ctx.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return files
  }),

  getFileMessages: privateProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      fileId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { cursor, limit, fileId } = input

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
          userId: ctx.userId
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'asc'
        }
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem!.id
      }

      return {
        items: messages,
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