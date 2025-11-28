import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { extractPdfText } from '@/lib/rag'
import { generateSummary } from '@/lib/summarizer'

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

