import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'

// Basic console log to verify the file is being loaded
console.log('PDF route handler initialized')

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  console.log('=== PDF Request Started ===')
  const fileId = context.params.id
  console.log('Request params:', { fileId })

  const { getUser } = getKindeServerSession()
  const user = await getUser()
  console.log('User session:', { userId: user?.id, isAuthenticated: !!user })

  if (!user || !user.id) {
    console.log('❌ Unauthorized access attempt')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    console.log('🔍 Looking up file in database...')
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    })

    if (!file || !file.url) {
      console.log('❌ File not found:', { fileId, userId: user.id })
      return new NextResponse('File not found', { status: 404 })
    }

    console.log('✅ File found:', { 
      fileId, 
      key: file.key, 
      url: file.url,
      userId: user.id 
    })

    // Fetch the PDF from UploadThing URL
    const response = await fetch(file.url)
    console.log('📡 Response status:', response.status)
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to fetch PDF:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return new NextResponse('Failed to fetch PDF', { status: response.status })
    }

    const pdfBuffer = await response.arrayBuffer()
    console.log('✅ Successfully fetched PDF, size:', pdfBuffer.byteLength)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="document.pdf"',
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('❌ Error serving PDF:', error)
    return new NextResponse('Error serving PDF', { status: 500 })
  } finally {
    console.log('=== PDF Request Completed ===')
  }
} 