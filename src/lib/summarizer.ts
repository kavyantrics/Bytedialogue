import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Generate document summary
export async function generateSummary(pdfText: string): Promise<string> {
  try {
    // Truncate text if too long (OpenAI has token limits)
    const maxLength = 15000 // Roughly 4000 tokens
    const truncatedText = pdfText.length > maxLength 
      ? pdfText.slice(0, maxLength) + '...'
      : pdfText

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of documents. Focus on key points, main topics, and important information.',
        },
        {
          role: 'user',
          content: `Please provide a comprehensive summary of the following document:\n\n${truncatedText}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent summaries
      max_tokens: 500,
    })

    const summary = response.choices[0]?.message?.content || 'Unable to generate summary.'
    return summary
  } catch (error) {
    console.error('[SUMMARIZER] Error generating summary:', error)
    throw error
  }
}

