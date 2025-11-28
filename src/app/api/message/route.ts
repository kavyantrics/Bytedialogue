import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Extract text from PDF using pdf-parse-debugging-disabled
async function extractPdfText(pdfUrl: string): Promise<string> {
  try {
    console.log(`[PDF_EXTRACTION] Fetching PDF from URL: ${pdfUrl}`)
    
    // Dynamic import to avoid issues during module load
    const pdfParse = (await import('pdf-parse-debugging-disabled')).default
    
    const response = await fetch(pdfUrl, {
      headers: {
        'Accept': 'application/pdf',
      },
    })
    
    console.log(`[PDF_EXTRACTION] Fetch response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error(`[PDF_EXTRACTION] Failed to fetch PDF: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type')
    console.log(`[PDF_EXTRACTION] Content-Type: ${contentType}`)
    
    if (!contentType || !contentType.includes('pdf')) {
      console.warn(`[PDF_EXTRACTION] Warning: Content-Type is ${contentType}, expected PDF`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    console.log(`[PDF_EXTRACTION] Received ${arrayBuffer.byteLength} bytes`)
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF file is empty')
    }
    
    const buffer = Buffer.from(arrayBuffer)
    console.log(`[PDF_EXTRACTION] Parsing PDF buffer...`)
    
    const data = await pdfParse(buffer)
    const text = data.text || ''
    
    console.log(`[PDF_EXTRACTION] Successfully parsed PDF, extracted ${text.length} characters`)
    
    if (text.trim().length === 0) {
      console.warn(`[PDF_EXTRACTION] Warning: PDF appears to have no extractable text (might be scanned/image-based PDF)`)
    }
    
    return text
  } catch (error) {
    console.error('[PDF_EXTRACTION] Error in extractPdfText:', error)
    if (error instanceof Error) {
      console.error('[PDF_EXTRACTION] Error message:', error.message)
      console.error('[PDF_EXTRACTION] Error stack:', error.stack)
    }
    throw error
  }
}

// Find relevant text chunks from PDF based on query
function findRelevantChunks(pdfText: string, query: string, maxChunks: number = 3): string[] {
  // Split PDF into sentences
  const sentences = pdfText.split(/[.!?]+/).filter(s => s.trim().length > 20)
  
  // Simple keyword matching (can be improved with embeddings)
  const queryWords = query.toLowerCase().split(/\s+/)
  
  // Score each sentence based on keyword matches
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const score = queryWords.reduce((acc, word) => {
      return acc + (lowerSentence.includes(word) ? 1 : 0)
    }, 0)
    return { sentence: sentence.trim(), score }
  })
  
  // Sort by score and get top chunks
  const relevantChunks = scoredSentences
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(item => item.sentence)
  
  // If no matches, return first few sentences as fallback
  if (relevantChunks.length === 0) {
    return sentences.slice(0, maxChunks)
  }
  
  return relevantChunks
}

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { fileId, message } = body

    if (!fileId || !message) {
      return new NextResponse('Missing fileId or message', { status: 400 })
    }

    // Store the user's message
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        userId: user.id,
        fileId,
      },
    })

    // Get the file to access PDF URL
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    })

    if (!file || !file.url) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Extract text from PDF
    let pdfContext = ''
    try {
      console.log(`[PDF_EXTRACTION] Starting extraction for file: ${file.id}, URL: ${file.url}`)
      const pdfText = await extractPdfText(file.url)
      console.log(`[PDF_EXTRACTION] Successfully extracted ${pdfText.length} characters from PDF`)
      
      if (!pdfText || pdfText.trim().length === 0) {
        console.warn('[PDF_EXTRACTION] PDF text is empty')
      } else {
        const relevantChunks = findRelevantChunks(pdfText, message)
        pdfContext = relevantChunks.join('\n\n')
        console.log(`[PDF_EXTRACTION] Found ${relevantChunks.length} relevant chunks, context length: ${pdfContext.length}`)
      }
    } catch (error) {
      console.error('[PDF_EXTRACTION] Error processing PDF:', error)
      console.error('[PDF_EXTRACTION] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fileId: file.id,
        fileUrl: file.url,
      })
      // Continue without PDF context if extraction fails
    }

    // Get previous messages for context
    const previousMessages = await db.message.findMany({
      where: {
        fileId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Format messages for OpenAI (reverse to get chronological order)
    const formattedMessages = previousMessages
      .reverse()
      .map(msg => ({
        role: msg.isUserMessage ? 'user' : 'assistant' as const,
        content: msg.text,
      })) as OpenAI.Chat.ChatCompletionMessageParam[]

    // Create system message with PDF context
    const systemMessage = pdfContext
      ? `You are a helpful assistant that answers questions about the uploaded PDF document. The user has uploaded a PDF document, and I've extracted the following relevant excerpts based on their question:

${pdfContext}

Please answer the user's question using ONLY the information provided in the excerpts above. If the specific information they're asking about is not present in these excerpts, clearly state that the information is not available in the document. Do not make up or guess information.`
      : `You are a helpful assistant. The user has uploaded a PDF document, but I was unable to extract text from it at this time. Please let the user know that you cannot access the document content and ask them to re-upload the file or provide more details about what they're looking for.`

    // Create the OpenAI chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        ...formattedMessages,
      ],
      stream: true,
    })

    // Create a new stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        let aiResponse = ''
        
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              aiResponse += content
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
          
          // Store the complete AI response
          if (aiResponse.trim()) {
            await db.message.create({
              data: {
                text: aiResponse,
                isUserMessage: false,
                userId: user.id,
                fileId,
              },
            })
          }
        } catch (error) {
          console.error('Stream processing error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[MESSAGE_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
