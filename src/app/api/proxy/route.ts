import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  console.log('Proxy request received:', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  })

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  console.log('User session:', {
    userId: user?.id,
    isAuthenticated: !!user,
  })

  if (!user || !user.id) {
    console.log('Unauthorized: No user or user ID')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const url = req.nextUrl.searchParams.get('url')
  const fileId = req.nextUrl.searchParams.get('fileId')

  console.log('Request params:', {
    url,
    fileId,
  })

  if (!url || !fileId) {
    console.log('Bad request: Missing url or fileId')
    return new NextResponse('Missing url or fileId param', { status: 400 })
  }

  try {
    // Verify user has access to this file
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    })

    console.log('File lookup result:', {
      found: !!file,
      fileId,
      userId: user.id,
    })

    if (!file) {
      console.log('File not found in database')
      return new NextResponse('File not found', { status: 404 })
    }

    console.log('Fetching PDF from:', url)
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/pdf',
      },
    })

    console.log('Cloudinary response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      console.error('Failed to fetch remote PDF', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url,
      })
      return new NextResponse('Failed to fetch remote PDF', { 
        status: response.status,
        statusText: response.statusText 
      })
    }

    const contentType = response.headers.get('Content-Type')
    console.log('Response headers:', {
      contentType,
      contentLength: response.headers.get('Content-Length'),
      contentDisposition: response.headers.get('Content-Disposition'),
    })

    // Forward the content-type and stream the body
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (e) {
    console.error('Proxy error:', e)
    return new NextResponse('Proxy error', { 
      status: 500,
      statusText: e instanceof Error ? e.message : 'Unknown error'
    })
  }
} 