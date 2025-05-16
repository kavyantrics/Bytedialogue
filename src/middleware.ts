import { handleAuth } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/dashboard/:path*', '/auth-callback'],
}

export async function middleware(request: NextRequest) {
  try {
    const response = await handleAuth(request)
    if (response instanceof Response) {
      return response
    }
    return NextResponse.next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.redirect(new URL('/auth-callback', request.url))
  }
}
