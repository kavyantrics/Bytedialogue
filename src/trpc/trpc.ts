import { initTRPC } from '@trpc/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { db } from '@/db';

const t = initTRPC.create();

const middleware = t.middleware;

const isAuth = middleware(async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    throw new Error('Unauthorized');
  }

  return {
    user,
  };
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth); 