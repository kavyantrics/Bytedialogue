import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { extractPdfText } from '@/lib/rag'
import { generateSummary } from '@/lib/summarizer'
import { recordUsage, calculateCost } from '@/lib/usageTracking'

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { fileId } = body

    if (!fileId) {
      return new NextResponse('Missing fileId', { status: 400 })
    }

    // Get the file
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    })

    if (!file || !file.url) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Check if summary already exists
    if (file.summary) {
      return NextResponse.json({ summary: file.summary })
    }

    // Extract text from PDF
    const pdfText = await extractPdfText(file.url)
    
    if (!pdfText || pdfText.trim().length === 0) {
      return new NextResponse('PDF has no extractable text', { status: 400 })
    }

    // Generate summary
    const summary = await generateSummary(pdfText)

    // Estimate tokens (rough: ~4 chars per token)
    const estimatedTokens = Math.ceil(pdfText.length / 4) + Math.ceil(summary.length / 4)
    const cost = calculateCost('gpt-3.5-turbo', estimatedTokens * 0.7, estimatedTokens * 0.3) // 70% prompt, 30% completion estimate

    // Record usage
    await recordUsage({
      userId: user.id,
      tokensUsed: estimatedTokens,
      promptTokens: Math.ceil(estimatedTokens * 0.7),
      completionTokens: Math.ceil(estimatedTokens * 0.3),
      cost,
      operationType: 'summary',
      model: 'gpt-3.5-turbo',
      fileId,
    })

    // Store summary in database
    await db.file.update({
      where: { id: fileId },
      data: { summary },
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('[SUMMARIZE_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

