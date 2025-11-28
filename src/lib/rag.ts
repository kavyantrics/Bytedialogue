import OpenAI from 'openai'
import { db } from '@/lib/db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Extract text from PDF using pdf-parse-debugging-disabled
export async function extractPdfText(pdfUrl: string): Promise<string> {
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

// Chunk text into smaller pieces for embedding
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end).trim()
    
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    // Move start position with overlap
    start = end - overlap
  }

  return chunks
}

// Generate embeddings for text chunks
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective embedding model
      input: texts,
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('[RAG] Error generating embeddings:', error)
    throw error
  }
}

// Store vector chunks in database
export async function storeVectorChunks(
  fileId: string,
  chunks: string[],
  embeddings: number[][],
  metadata?: Array<Record<string, unknown>>
): Promise<void> {
  try {
    // Delete existing chunks for this file
    await db.vectorChunk.deleteMany({
      where: { fileId },
    })

    // Create new chunks with embeddings
    await db.vectorChunk.createMany({
      data: chunks.map((content, index) => ({
        fileId,
        content,
        embedding: JSON.stringify(embeddings[index]),
        metadata: metadata?.[index] ? JSON.stringify(metadata[index]) : null,
      })),
    })

    // Mark file as processed
    await db.file.update({
      where: { id: fileId },
      data: { isProcessed: true },
    })

    console.log(`[RAG] Stored ${chunks.length} vector chunks for file ${fileId}`)
  } catch (error) {
    console.error('[RAG] Error storing vector chunks:', error)
    throw error
  }
}

// Find relevant chunks using cosine similarity
export async function findRelevantChunks(
  fileId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; score: number; metadata: Record<string, unknown> | null }>> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbeddings([query])
    const queryVector = queryEmbedding[0]

    // Get all chunks for this file
    const chunks = await db.vectorChunk.findMany({
      where: { fileId },
    })

    if (chunks.length === 0) {
      return []
    }

    // Calculate cosine similarity for each chunk
    const scoredChunks = chunks.map((chunk) => {
      if (!chunk.embedding) {
        return { chunk, score: 0 }
      }

      const chunkVector = JSON.parse(chunk.embedding) as number[]
      const similarity = cosineSimilarity(queryVector, chunkVector)

      return { chunk, score: similarity }
    })

    // Sort by score and return top K
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ chunk, score }) => ({
        content: chunk.content,
        score,
        metadata: chunk.metadata ? (JSON.parse(chunk.metadata) as Record<string, unknown>) : null,
      }))
  } catch (error) {
    console.error('[RAG] Error finding relevant chunks:', error)
    return []
  }
}

// Cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

// Process PDF and create vector embeddings
export async function processPdfForRAG(fileId: string, pdfText: string): Promise<void> {
  try {
    console.log(`[RAG] Processing PDF for RAG: ${fileId}`)
    
    // Chunk the text
    const chunks = chunkText(pdfText, 1000, 200)
    console.log(`[RAG] Created ${chunks.length} chunks`)

    // Generate embeddings in batches (OpenAI has rate limits)
    const batchSize = 100
    const allEmbeddings: number[][] = []

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await generateEmbeddings(batch)
      allEmbeddings.push(...embeddings)
      
      // Small delay to avoid rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Store in database
    await storeVectorChunks(fileId, chunks, allEmbeddings)
    
    console.log(`[RAG] Successfully processed PDF for RAG: ${fileId}`)
  } catch (error) {
    console.error('[RAG] Error processing PDF for RAG:', error)
    throw error
  }
}

