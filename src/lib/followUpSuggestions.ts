import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Generate follow-up question suggestions based on conversation context
export async function generateFollowUpSuggestions(
  lastMessage: string,
  documentContext: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates 3-4 relevant follow-up questions based on a conversation about a document. Return only a JSON array of question strings, no other text.',
        },
        {
          role: 'user',
          content: `Based on this conversation about a document, suggest 3-4 relevant follow-up questions.

Last message: ${lastMessage}
Document context: ${documentContext.substring(0, 1000)}...

Return a JSON array of 3-4 questions like: ["Question 1?", "Question 2?", "Question 3?"]`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{"questions": []}'
    const parsed = JSON.parse(content) as { questions?: string[] }
    
    return parsed.questions || []
  } catch (error) {
    console.error('[FOLLOW_UP] Error generating suggestions:', error)
    // Fallback to generic suggestions
    return [
      'Can you provide more details about this?',
      'What are the key takeaways?',
      'Are there any related topics?',
    ]
  }
}

