import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeJsonParse } from '@/lib/json'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    void request
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: { vendor: true },
    })

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...assessment,
      questions: safeJsonParse(assessment.questions, []),
      responses: safeJsonParse(assessment.responses, {}),
      scores: safeJsonParse(assessment.scores, {}),
      keyFindings: safeJsonParse(assessment.keyFindings, []),
      recommendations: safeJsonParse(assessment.recommendations, []),
      documentAnalysis: assessment.documentAnalysis
        ? safeJsonParse(assessment.documentAnalysis, null)
        : null,
      vendor: {
        ...assessment.vendor,
        dataCategories: safeJsonParse(
          assessment.vendor.dataCategories,
          []
        ),
        geographicPresence: safeJsonParse(
          assessment.vendor.geographicPresence,
          []
        ),
        certifications: safeJsonParse(
          assessment.vendor.certifications,
          []
        ),
        regulatoryBodies: safeJsonParse(
          assessment.vendor.regulatoryBodies,
          []
        ),
      },
    })
  } catch (error) {
    console.error('Assessment GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
