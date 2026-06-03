import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export function parseClaudeJson<T>(text: string): T {
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as T
}

export async function callClaude<T>(
  prompt: string,
  retry = true
): Promise<T> {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    if (!text) {
      throw new Error('Empty response from Claude')
    }

    return parseClaudeJson<T>(text)
  } catch (error) {
    if (retry) {
      return callClaude<T>(prompt, false)
    }
    throw error
  }
}
