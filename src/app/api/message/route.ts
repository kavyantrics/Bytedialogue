import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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

    // Create the OpenAI chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions about the uploaded document.',
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
