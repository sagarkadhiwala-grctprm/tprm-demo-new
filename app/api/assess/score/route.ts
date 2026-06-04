export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { AssessmentQuestion, ScoreResult } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, questions, responses } = body as {
      vendorId: string
      questions: AssessmentQuestion[]
      responses: Record<string, string>
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const qaBlock = questions
      .map((q) => {
        const answer = responses[q.id] || '(no answer provided)'
        return `Question: ${q.question} | Category: ${q.category} | Answer: ${answer}`
      })
      .join('\n\n')

    const prompt = `You are a senior TPRM analyst reviewing a vendor's risk assessment responses.

Vendor: ${vendor.companyName}
Service Type: ${vendor.serviceType}  
Risk Tier: ${vendor.tier}

Below are the assessment questions and the vendor's responses.
Analyze each response carefully for completeness, quality of controls described,
and any red flags or gaps.

${qaBlock}

Return ONLY valid JSON, no other text:
{
  "scores": {
    "q1": 75,
    "q2": 45
  },
  "overallScore": 62,
  "riskLevel": "Medium",
  "aiNarrative": "A detailed 4-5 sentence paragraph summarizing the overall risk posture of this vendor. Mention specific strengths and weaknesses observed in their responses. Be specific and professional.",
  "keyFindings": [
    "Finding 1 — specific observation from the responses",
    "Finding 2 — specific observation from the responses",
    "Finding 3 — specific observation from the responses"
  ],
  "recommendations": [
    "Action 1 — specific recommended remediation or follow-up",
    "Action 2 — specific recommended remediation or follow-up",
    "Action 3 — specific recommended remediation or follow-up"
  ]
}

Scoring guide:
- 80-100: Strong, comprehensive response with evidence of mature controls
- 60-79: Adequate response, some gaps but manageable
- 40-59: Weak response, significant gaps identified  
- 0-39: Inadequate or missing response, major risk flag

riskLevel must be one of: "Low", "Medium", "High", "Critical"

Include a score for every question id: ${questions.map((q) => q.id).join(', ')}`

    const result = await callClaude<ScoreResult>(prompt)

    const assessment = await prisma.assessment.create({
      data: {
        vendorId,
        questions: JSON.stringify(questions),
        responses: JSON.stringify(responses),
        scores: JSON.stringify(result.scores),
        overallScore: result.overallScore,
        riskLevel: result.riskLevel,
        aiNarrative: result.aiNarrative,
        keyFindings: JSON.stringify(result.keyFindings),
        recommendations: JSON.stringify(result.recommendations),
        status: 'completed',
      },
    })

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'completed' },
    })

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
