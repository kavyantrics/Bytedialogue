import { router, publicProcedure, privateProcedure } from './trpc';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { db } from '@/db';

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }

    // Check if user exists in database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

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
      });
    }

    return { success: true };
  }),
});

export type AppRouter = typeof appRouter; 