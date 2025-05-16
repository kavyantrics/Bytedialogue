import { createTRPCReact } from '@trpc/react-query'
import { type AppRouter } from '@/app/_trpc/server'
 
export const trpc = createTRPCReact<AppRouter>() 