import Anthropic from '@anthropic-ai/sdk'
import { DocumentAnalysisResult } from './documents'
import { buildDocumentAnalysisPrompt } from './document-prompt'
import { normalizeDocumentAnalysis } from './normalize-document-analysis'
import { parseAiJson } from './parse-ai-json'

const MODEL = 'claude-haiku-4-5-20251001'

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your-key-here') {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Set it in .env.local or Vercel environment variables.'
    )
  }
  return new Anthropic({ apiKey })
}

async function callClaudeForAnalysis(prompt: string): Promise<string> {
  const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block.type !== 'text' || !block.text) {
    throw new Error('Empty response from Claude')
  }
  return block.text
}

export async function analyzeDocumentWithAi(
  fileName: string,
  documentType: string,
  extractedText: string
): Promise<DocumentAnalysisResult> {
  if (!extractedText.trim()) {
    throw new Error('Document has no extractable text to analyze')
  }

  const prompt = buildDocumentAnalysisPrompt(
    fileName,
    documentType,
    extractedText
  )

  let rawText: string
  try {
    rawText = await callClaudeForAnalysis(prompt)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('authentication') || msg.includes('api_key')) {
      throw new Error('Invalid or missing Anthropic API key')
    }
    throw err
  }

  try {
    const parsed = parseAiJson<unknown>(rawText)
    return normalizeDocumentAnalysis(parsed)
  } catch {
    // Retry once with stricter instruction
    const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Reply with ONLY the JSON object, starting with { and ending with }. No other text.`
    const retryText = await callClaudeForAnalysis(retryPrompt)
    const parsed = parseAiJson<unknown>(retryText)
    return normalizeDocumentAnalysis(parsed)
  }
}
