import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeJsonParse } from '@/lib/json'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { decision, notes, approvedBy } = body as {
      decision: 'approved' | 'rejected'
      notes?: string
      approvedBy?: string
    }

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be approved or rejected' },
        { status: 400 }
      )
    }

    const assessment = await prisma.assessment.update({
      where: { id: params.id },
      data: {
        approvalStatus: decision,
        approvalNotes: notes ?? null,
        approvedBy: approvedBy ?? 'Risk Owner',
        approvedAt: new Date(),
      },
      include: { vendor: true },
    })

    return NextResponse.json({
      ...assessment,
      questions: safeJsonParse(assessment.questions, []),
      responses: safeJsonParse(assessment.responses, {}),
      scores: safeJsonParse(assessment.scores, {}),
      keyFindings: safeJsonParse(assessment.keyFindings, []),
      recommendations: safeJsonParse(assessment.recommendations, []),
      vendor: assessment.vendor,
    })
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json(
      { error: 'Failed to update approval status' },
      { status: 500 }
    )
  }
}
