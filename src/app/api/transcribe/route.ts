import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { recordUsage, calculateCost } from '@/lib/usageTracking'

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

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new NextResponse('No audio file provided', { status: 400 })
    }

    // Convert File to a format OpenAI can use
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a File-like object for OpenAI
    const audioFile = new File([buffer], file.name, { type: file.type })

    // Transcribe using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile as unknown as File,
      model: 'whisper-1',
      language: 'en', // Optional: specify language for better accuracy
    })

    // Estimate audio duration (rough: file size / bitrate)
    // Whisper pricing: $0.006 per minute
    const estimatedMinutes = file.size / (16000 * 2) / 60 // Rough estimate
    const cost = calculateCost('whisper-1', Math.ceil(estimatedMinutes * 60), 0)

    // Record usage
    await recordUsage({
      userId: user.id,
      tokensUsed: Math.ceil(estimatedMinutes * 60), // Approximate tokens
      promptTokens: Math.ceil(estimatedMinutes * 60),
      completionTokens: 0,
      cost,
      operationType: 'transcription',
      model: 'whisper-1',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('[TRANSCRIBE_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

