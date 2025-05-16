export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const file = await db.file.findFirst({
      where: {
        id: context.params.id,
        userId: user.id,
      },
    })

    if (!file) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Delete from database
    await db.file.delete({
      where: {
        id: file.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting file:', error)
    return new NextResponse('Error deleting file', { status: 500 })
  }
}
