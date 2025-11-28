import { NextResponse } from 'next/server'
import { getMetrics, register } from '@/lib/metrics'

export async function GET() {
  try {
    const metrics = await getMetrics()
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    })
  } catch (error) {
    console.error('Error generating metrics:', error)
    return new NextResponse('Error generating metrics', { status: 500 })
  }
}

