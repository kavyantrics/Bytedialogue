import { NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/admin'

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if current user is admin
    const currentUserIsAdmin = await isAdmin(user.id)
    if (!currentUserIsAdmin) {
      return new NextResponse('Forbidden: Admin access required', { status: 403 })
    }

    const body = await req.json()
    const { userId, email } = body

    if (!userId && !email) {
      return new NextResponse('Missing userId or email', { status: 400 })
    }

    // Find user
    const targetUser = await db.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: email },
        ],
      },
    })

    if (!targetUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ 
        message: 'User is already an admin',
        user: {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
        },
      })
    }

    // Promote to admin
    const updatedUser = await db.user.update({
      where: { id: targetUser.id },
      data: { role: 'ADMIN' },
    })

    return NextResponse.json({
      message: 'User promoted to admin successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    console.error('Error promoting user to admin:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

