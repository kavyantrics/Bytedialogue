import { getUserSubscriptionPlan } from '@/lib/stripe'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import Image from 'next/image'
import { Icons } from './Icons'
import Link from 'next/link'
import { Gem, Shield, ShieldCheck, CheckCircle, XCircle } from 'lucide-react'
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

interface UserAccountNavProps {
  email: string | undefined
  name: string
  imageUrl: string
}

const UserAccountNav = async ({
  email,
  imageUrl,
  name,
}: UserAccountNavProps) => {
  const subscriptionPlan = await getUserSubscriptionPlan()
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  
  const dbUser = user ? await db.user.findFirst({
    where: { id: user.id },
    select: {
      role: true,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  }) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className='overflow-visible'>
        <Button className='rounded-full h-8 w-8 aspect-square bg-slate-400'>
          <Avatar className='relative w-8 h-8'>
            {imageUrl ? (
              <div className='relative aspect-square h-full w-full'>
                <Image
                  fill
                  src={imageUrl}
                  alt='profile picture'
                  referrerPolicy='no-referrer'
                  sizes="32px"
                  quality={85}
                  loading="lazy"
                />
              </div>
            ) : (
              <AvatarFallback>
                <span className='sr-only'>{name}</span>
                <Icons.user className='h-4 w-4 text-zinc-900' />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='bg-white' align='end'>
        <div className='flex items-center justify-start gap-2 p-2'>
          <div className='flex flex-col space-y-0.5 leading-none'>
            {name && (
              <p className='font-medium text-sm text-black'>
                {name}
              </p>
            )}
            {email && (
              <p className='w-[200px] truncate text-xs text-zinc-700'>
                {email}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href='/dashboard'>Dashboard</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          {subscriptionPlan?.isSubscribed ? (
            <Link href='/dashboard/billing'>
              Manage Subscription
            </Link>
          ) : (
            <Link href='/pricing'>
              Upgrade{' '}
              <Gem className='text-blue-600 h-4 w-4 ml-1.5' />
            </Link>
          )}
        </DropdownMenuItem>

        {dbUser?.role === 'ADMIN' && (
          <DropdownMenuItem asChild>
            <Link href='/admin'>
              <Shield className='h-4 w-4 mr-2' />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Security Status */}
        <div className='px-2 py-1.5 text-xs'>
          <div className='flex items-center gap-2 mb-1'>
            {dbUser?.emailVerified ? (
              <>
                <CheckCircle className='h-3 w-3 text-green-500' />
                <span className='text-zinc-600'>Email Verified</span>
              </>
            ) : (
              <>
                <XCircle className='h-3 w-3 text-zinc-400' />
                <span className='text-zinc-400'>Email Not Verified</span>
              </>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {dbUser?.twoFactorEnabled ? (
              <>
                <ShieldCheck className='h-3 w-3 text-green-500' />
                <span className='text-zinc-600'>2FA Enabled</span>
              </>
            ) : (
              <>
                <Shield className='h-3 w-3 text-zinc-400' />
                <span className='text-zinc-400'>2FA Disabled</span>
              </>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className='cursor-pointer'>
            <LogoutLink>Log out</LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserAccountNav
