import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { AssessmentQuestion } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, serviceType, dataTypes, tier } = body

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

Return ONLY valid JSON array, no other text:
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

    const questions = await callClaude<AssessmentQuestion[]>(prompt)

    if (!Array.isArray(questions) || questions.length !== 8) {
      throw new Error('Expected exactly 8 questions from Claude')
    }

    return NextResponse.json(questions)
  } catch (error) {
    console.error('POST /api/assess/generate-questions error:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to generate assessment questions'
    return NextResponse.json(
      { error: `Claude API error: ${message}` },
      { status: 500 }
    )
  }
}
