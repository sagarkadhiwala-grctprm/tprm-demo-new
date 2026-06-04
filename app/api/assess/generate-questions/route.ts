import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, serviceType, dataTypes, tier } = body

    if (!companyName || !serviceType || dataTypes === undefined || tier === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = `You are a senior TPRM analyst. Generate exactly 8 risk assessment questions 
for this vendor. Tailor the questions to their specific service type and 
data access profile. Questions should probe for real risk gaps.

Vendor: ${companyName}
Service Type: ${serviceType}
Data Access: ${dataTypes}
Risk Tier: ${tier}

For Tier 1 vendors: focus heavily on security controls, incident response, 
data handling, certifications, and business continuity.

For Tier 2 vendors: balance between security, compliance, and operational resilience.

For Tier 3 vendors: focus on basic security hygiene and contractual compliance.

Return ONLY a valid JSON array, no markdown, no backticks, no explanation:
[
  {
    "id": "q1",
    "question": "full question text here",
    "category": "Security",
    "required": true
  }
]

Categories must be one of: Security, Compliance, Financial, Operational
Generate exactly 8 questions total.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let questions
    try {
      questions = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON', raw: cleaned },
        { status: 500 }
      )
    }

    if (!Array.isArray(questions) || questions.length !== 8) {
      return NextResponse.json(
        { error: 'Expected exactly 8 questions from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Generate questions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
