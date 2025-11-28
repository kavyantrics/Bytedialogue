import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractPdfText, findRelevantChunks } from '@/lib/rag'
import { generateFollowUpSuggestions } from '@/lib/followUpSuggestions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


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

    // Get the file to access PDF URL (with new fields)
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    })

    if (!file || !file.url) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Type assertion for isProcessed (may not exist on old files)
    const fileWithRAG = file as typeof file & { isProcessed?: boolean }

    // Get PDF context using RAG (vector embeddings) or fallback to keyword matching
    let pdfContext = ''
    let followUpSuggestions: string[] = []
    
    try {
      // Check if file has been processed for RAG
      if (fileWithRAG.isProcessed) {
        // Use RAG with vector embeddings
        console.log(`[RAG] Using vector embeddings for file: ${file.id}`)
        const relevantChunks = await findRelevantChunks(file.id, message, 5)
        
        if (relevantChunks.length > 0) {
          pdfContext = relevantChunks.map(chunk => chunk.content).join('\n\n')
          console.log(`[RAG] Found ${relevantChunks.length} relevant chunks using embeddings`)
        } else {
          console.log(`[RAG] No relevant chunks found, falling back to keyword matching`)
        }
      }
      
      // Fallback to keyword-based search if RAG not available or no results
      if (!pdfContext) {
        console.log(`[PDF_EXTRACTION] Using keyword-based extraction for file: ${file.id}`)
        const pdfText = await extractPdfText(file.url)
        
        if (pdfText && pdfText.trim().length > 0) {
          // Simple keyword matching as fallback
          const sentences = pdfText.split(/[.!?]+/).filter(s => s.trim().length > 20)
          const queryWords = message.toLowerCase().split(/\s+/)
          
          const scoredSentences = sentences.map(sentence => {
            const lowerSentence = sentence.toLowerCase()
            const score = queryWords.reduce((acc: number, word: string) => {
              return acc + (lowerSentence.includes(word) ? 1 : 0)
            }, 0)
            return { sentence: sentence.trim(), score }
          })
          
          const relevantChunks = scoredSentences
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.sentence)
          
          pdfContext = relevantChunks.length > 0 
            ? relevantChunks.join('\n\n')
            : sentences.slice(0, 3).join('\n\n')
          
          console.log(`[PDF_EXTRACTION] Found ${relevantChunks.length} relevant chunks using keyword matching`)
        }
      }
    } catch (error) {
      console.error('[PDF_EXTRACTION] Error processing PDF:', error)
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
          
          // Generate follow-up suggestions
          try {
            const conversationHistory = formattedMessages.map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : '',
            }))
            
            followUpSuggestions = await generateFollowUpSuggestions(
              message,
              pdfContext || '',
              conversationHistory
            )
          } catch (error) {
            console.error('[FOLLOW_UP] Error generating suggestions:', error)
          }
          
          // Store the complete AI response with follow-up suggestions
          if (aiResponse.trim()) {
            const messageData: {
              text: string
              isUserMessage: boolean
              userId: string
              fileId: string
              followUpSuggestions?: string | null
            } = {
              text: aiResponse,
              isUserMessage: false,
              userId: user.id,
              fileId,
            }
            
            if (followUpSuggestions.length > 0) {
              messageData.followUpSuggestions = JSON.stringify(followUpSuggestions)
            }
            
            await db.message.create({
              data: messageData,
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
