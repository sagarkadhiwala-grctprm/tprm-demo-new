import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { buildDocumentContextForPrompt } from '@/lib/documents'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, questions } = body as {
      vendorId: string
      questions: { id: string; question: string; category: string }[]
    }

    if (!vendorId || !questions?.length) {
      return NextResponse.json(
        { error: 'vendorId and questions are required' },
        { status: 400 }
      )
    }

    const docs = await prisma.vendorDocument.findMany({
      where: { vendorId, status: 'analyzed' },
      select: { fileName: true, documentType: true, aiAnalysis: true },
    })

    if (!docs.length) {
      return NextResponse.json(
        { error: 'Upload and analyze documents first' },
        { status: 400 }
      )
    }

    const documentContext = buildDocumentContextForPrompt(docs)
    const questionList = questions
      .map((q) => `ID: ${q.id} | Category: ${q.category} | Question: ${q.question}`)
      .join('\n')

    const prompt = `You are a TPRM analyst drafting vendor questionnaire responses from uploaded compliance documents.

${documentContext}

Questions:
${questionList}

For each question ID, write a professional response (3-6 sentences) grounded in evidence from the documents. Note gaps honestly where documents are silent.

Return ONLY valid JSON object mapping question id to response text:
{ "q1": "response...", "q2": "response..." }`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const suggestions = JSON.parse(cleaned)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Suggest responses error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
